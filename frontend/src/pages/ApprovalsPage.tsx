import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, message, Space, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const ApprovalsPage: React.FC = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance/pending');
            setPending(res.data);
        } catch {
            message.error("Failed to load pending attendance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await api.post('/attendance/approve', { pending_id: id, action });
            message.success(`Attendance ${action}d`);
            fetchPending(); // Refresh list
        } catch {
            message.error("Action failed");
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'user_name',
            key: 'user_name',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'student' ? 'blue' : 'green'}>{role.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Time',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (val: number) => (val * 100).toFixed(1) + '%',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: { _id: string }) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />} 
                        onClick={() => handleAction(record._id, 'approve')}
                        style={{ backgroundColor: '#52c41a' }}
                    >
                        Approve
                    </Button>
                    <Button 
                        danger 
                        icon={<CloseCircleOutlined />} 
                        onClick={() => handleAction(record._id, 'reject')}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>Attendance Approvals</Title>
            <Card title="Pending Requests" bordered={false}>
                <Table 
                    dataSource={pending} 
                    columns={columns} 
                    rowKey="_id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default ApprovalsPage;
