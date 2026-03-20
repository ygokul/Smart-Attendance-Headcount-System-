import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { ScanOutlined, LoginOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const LandingPage: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            flexDirection: 'column'
        }}>
            <Card style={{ 
                width: 500, 
                textAlign: 'center', 
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
                <Title level={2}>Face Attendance System</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
                    Welcome to the automated attendance tracking portal.
                </Text>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Link to="/attendance">
                        <Button type="primary" size="large" icon={<ScanOutlined />} block style={{ height: 60, fontSize: 18 }}>
                            Mark Attendance (Scanner)
                        </Button>
                    </Link>
                    
                    <div style={{ position: 'relative', height: 1, background: '#f0f0f0', margin: '16px 0' }}>
                        <span style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)', 
                            background: 'white', 
                            padding: '0 8px',
                            color: '#999'
                        }}>Authorized Personnel</span>
                    </div>

                    <Link to="/login">
                        <Button size="large" icon={<LoginOutlined />} block>
                            Admin Login
                        </Button>
                    </Link>
                </Space>
            </Card>
            
            <div style={{ marginTop: 24, color: '#666' }}>
                &copy; {new Date().getFullYear()} Face Attendance System
            </div>
        </div>
    );
};

export default LandingPage;
