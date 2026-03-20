import React, { useState } from 'react';
import { Layout, Menu, theme, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link to="/admin">Dashboard</Link>, '/admin', <PieChartOutlined />),
  
  getItem('User Management', 'sub1', <UserOutlined />, [
    getItem(<Link to="/admin/users">All Users</Link>, '/admin/users'),
    getItem(<Link to="/admin/users/create">Add User</Link>, '/admin/users/create'),
  ]),
  
  getItem('Academics', 'grp1', null, [
    getItem(<Link to="/admin/departments">Departments</Link>, '/admin/departments', <DesktopOutlined />),
    getItem(<Link to="/admin/classes">Classes</Link>, '/admin/classes', <FileOutlined />),
  ], 'group'),

  getItem(<Link to="/admin/reports">Attendance Reports</Link>, '/admin/reports', <FileOutlined />),
  getItem(<Link to="/admin/logs">Logs</Link>, '/admin/logs', <FileOutlined />),
  getItem(<Link to="/admin/approvals">Approvals</Link>, '/admin/approvals', <FileOutlined />), 
  getItem(<Link to="/admin/settings">Settings</Link>, '/admin/settings', <PieChartOutlined />),
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{ 
            borderRight: '1px solid #f0f0f0', 
            boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="demo-logo-vertical" style={{ 
                height: 64, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f0f0f0',
                marginBottom: 8,
                flexShrink: 0
            }}>
                <DesktopOutlined style={{ fontSize: 24, color: '#1677ff', marginRight: collapsed ? 0 : 10 }} />
                {!collapsed && <span style={{ fontSize: 18, fontWeight: 'bold', color: '#001529' }}>FaceAdmin</span>}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Menu 
                    theme="light" 
                    defaultSelectedKeys={[location.pathname]} 
                    defaultOpenKeys={['sub1']}
                    mode="inline" 
                    items={items} 
                    style={{ borderRight: 0 }}
                />
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                 <Button 
                    type={collapsed ? "text" : "default"}
                    danger 
                    block 
                    icon={<UserOutlined />} 
                    onClick={() => {
                         useAuth.getState().logout();
                         window.location.href = '/login';
                    }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: collapsed ? 'center' : 'center',
                        gap: 8
                    }}
                 >
                     {!collapsed && "Logout"}
                 </Button>
            </div>
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: 1 }}>
             <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Face Attendance Admin</h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <span style={{ fontSize: 14, color: '#666' }}>Welcome, Admin</span>
             </div>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              marginTop: 16
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Face Attendance System ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
