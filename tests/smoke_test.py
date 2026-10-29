"""冒烟测试: python tests/smoke_test.py  (使用临时数据库, 不影响正式数据)"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SALES_DB"] = os.path.join(tempfile.mkdtemp(), "t.db")

import app as A  # noqa: E402

A.DB_PATH = os.environ["SALES_DB"]
import seed_demo  # noqa: E402,F401  生成演示数据到临时库

A.app.config["TESTING"] = True
fails = []


def client(username, password="demo1234", remember=False):
    c = A.app.test_client()
    c.token = c.get("/api/session").json["csrf"]
    r = c.post("/api/login", json={"username": username, "password": password, "remember": remember},
               headers={"X-CSRF-Token": c.token})
    assert r.status_code == 200, f"{username} 登录失败: {r.json}"
    c.token = r.json["csrf"]  # 登录后令牌已轮换
    c.login_cookie = ";".join(r.headers.getlist("Set-Cookie"))
    return c


def check(c, url, code=200, who=""):
    r = c.get(url)
    if r.status_code != code:
        fails.append(f"[{who}] GET {url} -> {r.status_code}")
    if b"password_hash" in r.data:
        fails.append(f"[{who}] GET {url} 泄露了 password_hash")
    return r


def send(c, method, url, data=None, who="", code=200):
    r = c.open(url, method=method, json=data or {}, headers={"X-CSRF-Token": c.token})
    if r.status_code != code:
        fails.append(f"[{who}] {method} {url} -> {r.status_code} {r.json}")
    return r


month = A.date.today().strftime("%Y-%m")
last = A.prev_month(month)
apis = ["/api/session", "/api/dashboard", "/api/options", "/api/visits", "/api/visits/form", "/api/trips",
        "/api/weekly", "/api/weekly/form", f"/api/monthly?month={last}", f"/api/monthly?month={month}",
        "/api/customers", "/api/stats", "/api/stats/export", "/api/customers/1", "/api/contacts?customer_id=1"]

for who in ("admin", "zhangjl", "lixm", "wangf"):
    c = client(who)
    for p in apis:
        check(c, p, who=who)
    for p in ("/api/approvals", "/api/users", "/api/logs", "/api/users/form", "/api/users/form?id=2"):
        expected = 200 if who == "admin" or (who == "zhangjl" and p == "/api/approvals") else 403
        check(c, p, expected, who)

# 未登录访问接口返回 401, 未知接口返回 JSON 404
anon = A.app.test_client()
check(anon, "/api/visits", 401, "anon")
if anon.get("/api/no-such-api").json.get("error") != "页面或记录不存在":
    fails.append("未知接口未返回 JSON 404")

# 数据隔离: 王芳看不到李晓明的拜访
wang = client("wangf")
with A.app.app_context():
    li_visit = A.q("SELECT v.id FROM visits v JOIN users u ON u.id=v.user_id WHERE u.username='lixm' LIMIT 1", one=True)["id"]
    li_trip = A.q("SELECT t.id FROM trips t JOIN users u ON u.id=t.user_id WHERE u.username='lixm' LIMIT 1", one=True)["id"]
    li_month = A.q("SELECT m.id FROM monthly_reports m JOIN users u ON u.id=m.user_id WHERE u.username='lixm' "
                   "AND status='submitted'", one=True)["id"]
check(wang, f"/api/visits/{li_visit}", 403, "wangf 越权")
check(wang, f"/api/trips/{li_trip}", 403, "wangf 越权")
send(wang, "PUT", f"/api/visits/{li_visit}", {"content": "越权修改"}, "wangf 越权", 403)
send(wang, "POST", f"/api/approve/monthly/{li_month}", {"decision": "approved"}, "销售员审批", 403)

# 无 CSRF 令牌的写请求被拒
if wang.post("/api/visits", json={"customer_id": 1}).status_code != 400:
    fails.append("缺少 CSRF 未被拦截")

# 销售员完整流程: 建出差 -> 添加拜访 -> 提交 -> 主管退回 -> 修改 -> 再提交 -> 通过
li = client("lixm")
with A.app.app_context():
    cust = A.q("SELECT id FROM customers WHERE status='active' AND owner_id=(SELECT id FROM users WHERE username='lixm')",
               one=True)["id"]
far = A.date.today() - A.timedelta(days=400)
r = send(li, "POST", "/api/trips", {"start_date": far.isoformat(), "end_date": (far + A.timedelta(days=1)).isoformat(),
                                    "destination": "测试城市", "cost_hotel": "300", "action": "save"}, "lixm")
tid = r.json["id"]
r = send(li, "POST", "/api/visits", {"customer_id": cust, "visit_date": far.isoformat(), "visit_type": "回访",
                                     "contact_name": "测试联系人", "contact_title": "采购", "trip_id": tid,
                                     "content": "这是一条测试洽谈内容, 超过十个字。"}, "lixm")
assert r.json.get("id"), "拜访保存失败"
r = send(li, "POST", "/api/visits", {"customer_id": cust, "visit_date": "2099-01-01", "contact_name": "x",
                                     "content": "太短"}, "lixm", 400)
if "拜访日期不能晚于今天" not in r.json["error"]:
    fails.append("未来日期校验失效")
send(li, "POST", f"/api/trips/{tid}/submit", who="lixm")
mgr = client("zhangjl")
send(mgr, "POST", f"/api/approve/trip/{tid}", {"decision": "rejected", "comment": "请补充出差总结"}, "zhangjl")
with A.app.app_context():
    assert A.q("SELECT status FROM trips WHERE id=?", (tid,), one=True)["status"] == "rejected"
send(li, "PUT", f"/api/trips/{tid}", {"start_date": far.isoformat(), "end_date": (far + A.timedelta(days=1)).isoformat(),
                                      "destination": "测试城市", "summary": "已补充", "action": "submit"}, "lixm")
send(mgr, "POST", f"/api/approve/trip/{tid}", {"decision": "approved", "comment": "同意"}, "zhangjl")
with A.app.app_context():
    assert A.q("SELECT status FROM trips WHERE id=?", (tid,), one=True)["status"] == "approved"
    assert A.q("SELECT COUNT(*) c FROM approvals WHERE target_type='trip' AND target_id=?", (tid,), one=True)["c"] == 2
r = check(li, f"/api/trips/{tid}", who="lixm")
vid = r.json["visits"][0]["id"]
check(li, f"/api/visits/form?id={vid}", 403, "已审批出差中的拜访不可修改")
send(li, "DELETE", f"/api/visits/{vid}", who="已审批出差中的拜访不可删除", code=403)

# 周报 + 月报
send(li, "POST", "/api/weekly", {"week": far.isoformat(), "summary": "测试周报总结内容十个字以上", "action": "submit"}, "lixm")
r = send(li, "POST", "/api/weekly", {"week": far.isoformat(), "summary": "同一周再写一份周报内容", "action": "save"},
         "lixm", 409)
if not r.json.get("dup_id"):
    fails.append("重复周报未返回已有周报 id")
send(mgr, "POST", "/api/monthly/generate", {"month": far.strftime("%Y-%m")}, "zhangjl")
with A.app.app_context():
    m = A.q("SELECT * FROM monthly_reports WHERE month=? AND user_id=(SELECT id FROM users WHERE username='lixm')",
            (far.strftime("%Y-%m"),), one=True)
    assert m and "拜访客户 1 次" in m["analysis"], m and m["analysis"]
r = check(li, f"/api/monthly/{m['id']}", who="lixm")
assert r.json["stats"]["visit_count"] == 1 and r.json["mine"]
send(li, "POST", f"/api/monthly/{m['id']}", {"self_summary": "补充", "action": "submit"}, "lixm")
send(mgr, "POST", f"/api/approve/monthly/{m['id']}", {"decision": "approved", "comment": "好"}, "zhangjl")

# 自动生成上月报告 (幂等)
A.auto_generate_last_month()
A.auto_generate_last_month()

# 客户申请与审核
send(li, "POST", "/api/customers", {"name": "测试新客户", "level": "A"}, "lixm")
with A.app.app_context():
    nc = A.q("SELECT * FROM customers WHERE name='测试新客户'", one=True)
    assert nc["status"] == "pending"
send(li, "PUT", f"/api/customers/{nc['id']}", {"name": "测试新客户"}, "销售员修改客户", 403)
send(mgr, "POST", f"/api/customers/{nc['id']}/approve", {"ok": True}, "zhangjl")

# 导出 Excel 内容
r = mgr.get(f"/api/stats/export?start={far.isoformat()}&end={A.date.today().isoformat()}")
assert r.data[:2] == b"PK", "导出不是 xlsx"

# 离职交接: 停用王芳并把客户改派给李晓明
adm = client("admin")
with A.app.app_context():
    wid = A.q("SELECT id FROM users WHERE username='wangf'", one=True)["id"]
    lid = A.q("SELECT id FROM users WHERE username='lixm'", one=True)["id"]
check(adm, f"/api/users/form?id={wid}", who="admin")
send(adm, "PUT", f"/api/users/{wid}", {"username": "wangf", "name": "王芳", "role": "sales", "transfer_to": lid}, "admin")
with A.app.app_context():
    assert A.q("SELECT COUNT(*) c FROM customers WHERE owner_id=?", (wid,), one=True)["c"] == 0, "改派失败"
    assert A.q("SELECT active FROM users WHERE id=?", (wid,), one=True)["active"] == 0, "停用失败"
    assert A.q("SELECT COUNT(*) c FROM visits WHERE user_id=?", (wid,), one=True)["c"] > 0, "历史拜访丢失"

# 新账号首次登录必须先改密码
send(adm, "POST", "/api/users", {"username": "newbie", "name": "新人", "role": "sales", "password": "init123",
                                 "active": True}, "admin")
nb = client("newbie", "init123")
r = check(nb, "/api/dashboard", 403, "newbie 未改密")
if r.json.get("code") != "must_change_pw":
    fails.append("未改密时接口未返回 must_change_pw")
check(nb, "/api/session", who="newbie")
send(nb, "POST", "/api/password", {"old": "init123", "new": "abcd1234", "new2": "abcd1234"}, "newbie")
check(nb, "/api/dashboard", who="newbie 已改密")

# 记住我: 勾选后 cookie 带过期时间 (7 天), 不勾选为浏览器会话 cookie
if "Expires=" not in client("lixm", remember=True).login_cookie:
    fails.append("勾选记住我后 cookie 没有过期时间")
if "Expires=" in client("lixm").login_cookie:
    fails.append("未勾选记住我时 cookie 不应带过期时间")

# 前端页面: 任意非接口路径返回 index.html, 构建产物按文件返回
dist = tempfile.mkdtemp()
os.makedirs(os.path.join(dist, "assets"))
with open(os.path.join(dist, "index.html"), "w", encoding="utf-8") as f:
    f.write("<div id=root></div>")
with open(os.path.join(dist, "assets", "app.js"), "w", encoding="utf-8") as f:
    f.write("console.log(1)")
A.DIST_DIR = dist
spa = A.app.test_client()
if b"id=root" not in spa.get("/trips/12").data:
    fails.append("前端路由未返回 index.html")
if spa.get("/assets/app.js").data != b"console.log(1)":
    fails.append("构建产物未正确返回")

if fails:
    print("失败:\n  " + "\n  ".join(fails))
    sys.exit(1)
print("全部通过")
