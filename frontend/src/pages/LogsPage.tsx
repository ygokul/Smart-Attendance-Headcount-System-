import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Card, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import dayjs from 'dayjs';

interface LogItem {
    _id: string;
    student_name: string;
    role: string;
    class_name: string;
    date: string;
    check_in: string;
    check_out: string;
    status: string;
}

const LogsPage: React.FC = () => {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(dayjs());
    const [role] = useState<string>('faculty'); // Hardcoded to faculty

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const dateStr = date.format('YYYY-MM-DD');
                let url = `/reports/attendance?date=${dateStr}`;
                if (role !== 'all') {
                    url += `&role=${role}`;
                }
                
                const res = await api.get(url);
                setLogs(res.data);
            } catch (err) {
                console.error(err);
                message.error('Failed to fetch logs');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [date, role]);

    const columns: ColumnsType<LogItem> = [
        {
            title: 'Name',
            dataIndex: 'student_name',
            key: 'student_name',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => <Tag color={role === 'faculty' ? 'purple' : 'blue'}>{role.toUpperCase()}</Tag>
        },
        {
            title: 'Class',
            dataIndex: 'class_name',
            key: 'class_name',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Check In',
            dataIndex: 'check_in',
            key: 'check_in',
        },
        {
            title: 'Check Out',
            dataIndex: 'check_out',
            key: 'check_out',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'present' ? 'green' : status === 'absent' ? 'red' : 'orange'}>
                    {status ? status.toUpperCase() : 'UNKNOWN'}
                </Tag>
            )
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Faculty Logs</h2>
                <div style={{ display: 'flex', gap: 16 }}>
                    <DatePicker 
                        value={date} 
                        onChange={(d) => d && setDate(d)} 
                        allowClear={false}
                    />
                </div>
            </div>

            <Card>
                <Table 
                    columns={columns} 
                    dataSource={logs} 
                    rowKey="_id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default LogsPage;
