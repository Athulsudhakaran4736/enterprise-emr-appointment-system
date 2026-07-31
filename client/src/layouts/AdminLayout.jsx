import {
  App as AntApp,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const navigationItems = [
  {
    key: "/admin/dashboard",
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "/admin/departments",
    label: <Link to="/admin/departments">Departments</Link>,
  },
  { key: "/admin/doctors", label: <Link to="/admin/doctors">Doctors</Link> },
  {
    key: "/admin/schedules",
    label: <Link to="/admin/schedules">Schedules</Link>,
  },
  {
    key: "/admin/appointments",
    label: <Link to="/admin/appointments">Appointments</Link>,
  },
  { key: "/admin/patients", label: <Link to="/admin/patients">Patients</Link> },
  {
    key: "/admin/receptionists",
    label: <Link to="/admin/receptionists">Receptionists</Link>,
  },
];

function AdminLayout() {
  const { message } = AntApp.useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const screens = Grid.useBreakpoint();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isMobile = !screens.lg;

  const selectedKey =
    navigationItems.find((item) => pathname.startsWith(item.key))?.key ||
    "/admin/dashboard";

  const handleLogout = async () => {
    await signOut();
    message.success("Signed out successfully");
    navigate("/login", { replace: true });
  };

  const handleNavigationClick = () => {
    if (isMobile) {
      setMobileNavOpen(false);
    }
  };

  const navigationMenu = (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[selectedKey]}
      items={navigationItems}
      onClick={handleNavigationClick}
      className="admin-menu !border-0 !bg-transparent"
    />
  );

  const brandBlock = (
    <div className="mb-8 rounded-[30px] border border-white/10 bg-white/5 p-7 text-white shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
      <Text className="!text-[11px] !font-semibold !uppercase !tracking-[0.35em] !text-teal-300">
        Enterprise EMR
      </Text>
    </div>
  );

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
            background: "#020617",
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
                className="admin-mobile-trigger !rounded-full !px-4"
              >
                Menu
              </Button>
            ) : null}
            <div>
              <Title level={3} className="!mb-1 !mt-0 !text-slate-900">
                EMR Admin Console
              </Title>
              <Text className="!text-base !text-slate-500">
                Protected access for enterprise appointment management.
              </Text>
            </div>
          </div>

          <Space
            size="middle"
            align="center"
            wrap
            className="admin-header-actions"
          >
            <div className="admin-user-meta text-right">
              <Text className="!block !font-semibold !text-slate-900">
                {user?.name}
              </Text>
              <Text className="!text-slate-500">{user?.email}</Text>
            </div>
            <Tag color="cyan" className="!rounded-full !px-3 !py-1 !text-sm">
              {user?.role}
            </Tag>
            <Button
              onClick={handleLogout}
              size="large"
              className="!rounded-full !px-5"
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
