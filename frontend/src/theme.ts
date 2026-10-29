import type { ThemeConfig } from 'antd'

/** 取自设计图的蓝色系 */
export const PRIMARY = '#2f6bff'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY,
    colorLink: PRIMARY,
    colorBgLayout: '#f3f6fb',
    colorTextBase: '#1f2937',
    borderRadius: 8,
    fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: { headerBg: '#ffffff', siderBg: '#ffffff', headerHeight: 64, headerPadding: '0 24px' },
    Menu: { itemBorderRadius: 8, itemSelectedBg: '#eaf1ff', itemHeight: 44, iconSize: 16 },
    Card: { borderRadiusLG: 14, headerFontSize: 16 },
    Table: { headerBg: '#f7f9fc', headerColor: '#6b7280' },
    Button: { primaryShadow: '0 6px 16px rgba(47, 107, 255, 0.24)' },
  },
}
