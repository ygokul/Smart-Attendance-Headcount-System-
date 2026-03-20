import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Using OAuth2 password flow, expects form-data usually, but let's check our backend
            // Our backend uses OAuth2PasswordRequestForm which expects x-www-form-urlencoded
            
            // Using URLSearchParams forces axios to use application/x-www-form-urlencoded
            // This is the standard for OAuth2 password flow
            const params = new URLSearchParams();
            params.append('username', values.username);
            params.append('password', values.password);

            const res = await api.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = res.data;
            
            // Get user info
            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            login(access_token, meRes.data);
            message.success('Login successful');
            navigate('/admin');
            
        } catch (err: any) {
            console.error(err);
            message.error(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: '#f0f2f5' 
        }}>
            <Card 
                title="Face Attendance System - Admin Login" 
                style={{ width: 400 }}
                extra={<Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/')} />}
            >
                <Form
                    name="login"
                    onFinish={onFinish}
                    initialValues={{ remember: true }}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please input your Username!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Username / Email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>
                    
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
