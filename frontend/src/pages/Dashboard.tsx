import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { UserOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        total_students: 0,
        total_faculty: 0,
        present_today: 0,
        attendance_rate: 0
    });

    useEffect(() => {
        // Fetch stats from API
        api.get('/reports/dashboard-stats')
           .then(res => setStats(res.data))
           .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: 24, fontSize: '24px', fontWeight: 600 }}>Admin Dashboard</h2>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12 }}>
                        <Statistic 
                            title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Students</span>}
                            value={stats.total_students} 
                            valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
                            prefix={<TeamOutlined style={{ color: 'rgba(255,255,255,0.5)', marginRight: 8 }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', borderRadius: 12 }}>
                        <Statistic 
                            title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Faculty</span>}
                            value={stats.total_faculty} 
                            valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
                            prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.5)', marginRight: 8 }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', borderRadius: 12 }}>
                        <Statistic 
                            title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Present Today</span>}
                            value={stats.present_today} 
                            valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
                            prefix={<CheckCircleOutlined style={{ color: 'rgba(255,255,255,0.5)', marginRight: 8 }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', borderRadius: 12 }}>
                        <Statistic 
                            title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Attendance Rate</span>}
                            value={stats.attendance_rate} 
                            precision={1} 
                            suffix="%" 
                            valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>
            
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                     <Card title="Quick Actions" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                         <p style={{ color: '#888' }}>
                             Welcome to the Face Attendance System Admin Panel. Use the sidebar to manage users, classes, and departments.
                             <br />
                             Go to <b>Reports</b> to download attendance logs.
                         </p>
                     </Card>
                </Col>
            </Row>
        </div>
    );

};

export default Dashboard;
