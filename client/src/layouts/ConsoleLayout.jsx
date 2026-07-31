import {
  App as AntApp,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from 'antd'
import { DownOutlined, MenuOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

function ConsoleLayout({ title, subtitle, roleLabel, brandLabel, navigationItems }) {
  const { message } = AntApp.useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const screens = Grid.useBreakpoint()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isMobile = !screens.lg

  const selectedKey =
    navigationItems.find((item) => pathname.startsWith(item.key))?.key || navigationItems[0]?.key

  const handleLogout = async () => {
    await signOut()
    message.success('Signed out successfully')
    navigate('/login', { replace: true })
  }

  const handleNavigationClick = () => {
    if (isMobile) {
      setMobileNavOpen(false)
    }
  }

  const navigationMenu = (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={navigationItems}
      onClick={handleNavigationClick}
      className="admin-menu !border-0 !bg-transparent"
    />
  )

  const accountMenuItems = [
    {
      key: 'meta',
      disabled: true,
      label: (
        <div className="min-w-[220px] py-1">
          <div className="font-semibold text-slate-900">{user?.name}</div>
          <div className="text-slate-500">{user?.email}</div>
          <Tag color="cyan" className="!mt-3 !rounded-full !px-3 !py-1 !text-xs">
            {roleLabel || user?.role}
          </Tag>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      danger: true,
    },
  ]

  const brandBlock = (
    <div className="mb-8 rounded-[30px] border border-white/10 bg-white/5 p-7 text-white shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
      <Text className="!text-[11px] !font-semibold !uppercase !tracking-[0.35em] !text-teal-300">
        {brandLabel}
      </Text>
    </div>
  )

  return (
    <Layout className="admin-shell min-h-screen bg-slate-100">
      {!isMobile ? (
        <Sider width={288} className="admin-sider !bg-slate-950">
          <div className="flex h-full flex-col px-5 py-6">
            {brandBlock}
            {navigationMenu}
          </div>
        </Sider>
      ) : null}

      <Drawer
        placement="left"
        width={304}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        closable={false}
        styles={{
          body: {
            padding: 0,
            background: '#020617',
          },
        }}
      >
        <div className="flex min-h-full flex-col bg-slate-950 px-5 py-6">
          {brandBlock}
          {navigationMenu}
        </div>
      </Drawer>

      <Layout className="!bg-slate-100">
        <Header className="admin-header !bg-white">
          <div className="flex items-start gap-3">
            {isMobile ? (
              <Button
                onClick={() => setMobileNavOpen(true)}
                size="large"
                icon={<MenuOutlined />}
                aria-label="Open navigation menu"
                className="admin-mobile-trigger !rounded-full !px-3"
              />
            ) : null}
            <div>
              <Title level={3} className="!mb-1 !mt-0 !text-slate-900">
                {title}
              </Title>
              <Text className="!text-base !text-slate-500">{subtitle}</Text>
            </div>
          </div>

          <Dropdown
            trigger={['click']}
            menu={{
              items: accountMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  handleLogout()
                }
              },
            }}
          >
            <Button size="large" className="!h-auto !rounded-full !px-4 !py-2">
              <Space size="small" align="center">
                <span className="text-slate-700">{user?.email}</span>
                <DownOutlined className="text-slate-400" />
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default ConsoleLayout
