import type { ThemeConfig } from 'antd'

/** 取自设计图的蓝色系 */
export const PRIMARY = '#2f6bff'

/** 西文/数字用 Segoe UI (Windows) 或系统字体 (苹果), 中文回退到苹方/微软雅黑; 与 index.css 中 body 一致 */
export const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY,
    colorLink: PRIMARY,
    colorBgLayout: '#f3f6fb',
    colorTextBase: '#1f2937',
    borderRadius: 8,
    fontFamily: FONT,
  },
  components: {
    Layout: {
      headerBg: '#ffffff', siderBg: '#ffffff', headerHeight: 64, headerPadding: '0 24px',
    },
    Menu: { itemBorderRadius: 8, itemSelectedBg: '#eaf1ff', itemHeight: 44, iconSize: 16 },
    Card: { borderRadiusLG: 14, headerFontSize: 16 },
    Table: { headerBg: '#f7f9fc', headerColor: '#6b7280' },
    Button: { primaryShadow: '0 6px 16px rgba(47, 107, 255, 0.24)' },
  },
}
