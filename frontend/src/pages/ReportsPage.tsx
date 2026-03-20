import React, { useEffect, useState } from 'react';
import { Table, Tabs, Button, message, Radio, Tag } from 'antd';
import api from '../services/api';

const ReportsPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [attendance, setAttendance] = useState<any[]>([]);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [subjectFilter, setSubjectFilter] = useState('');
    const [sessionFilter, setSessionFilter] = useState<string>('All');
    
    // Absent Report State
    const [absentStudents, setAbsentStudents] = useState<any[]>([]);
    const [absentPeriod, setAbsentPeriod] = useState<string>('full_day'); // morning, lunch, full_day
    const [activeTab, setActiveTab] = useState('1');

    const fetchAttendance = React.useCallback(async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { date };
            if (activeTab === '1' && subjectFilter) {
                params.subject = subjectFilter;
            }
            const res = await api.get('/reports/attendance', { params });
            setAttendance(res.data);
        } catch {
            message.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [date, activeTab, subjectFilter]);
    
    const fetchAbsent = React.useCallback(async () => {
         setLoading(true);
         try {
             const res = await api.get('/reports/absent', { 
                 params: { date, period: absentPeriod } 
             });
             setAbsentStudents(res.data);
         } catch {
             message.error("Failed to fetch absent students");
         } finally {
             setLoading(false);
         }
    }, [date, absentPeriod]);

    useEffect(() => {
        if (activeTab === '1' || activeTab === '2') {
             fetchAttendance();
        } else if (activeTab === '3') {
             fetchAbsent();
        }
    }, [fetchAttendance, fetchAbsent, activeTab]);


    // Filtered Data (Present)
    const studentsData = attendance.filter((r) => r.role === 'student');
    const facultyData = attendance.filter((r) => r.role === 'faculty');

    const filteredStudents = sessionFilter === 'All' 
        ? studentsData 
        : studentsData.filter(r => r.period === sessionFilter);

    const studentColumns = [
        { title: 'Date', dataIndex: 'date' },
        { title: 'Name', dataIndex: 'student_name' },
        { title: 'Session', dataIndex: 'period' },
        { title: 'Subject', dataIndex: 'subject' },
        { title: 'Status', dataIndex: 'status' },
        { title: 'Time', dataIndex: 'check_in' }, // Use check_in from API
        { title: 'Confidence', dataIndex: 'confidence', render: (c: number) => c ? c.toFixed(2) : 'N/A' },
        {
            title: 'Action',
            key: 'action',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => (
                <Button 
                    danger 
                    size="small" 
                    onClick={async () => {
                        try {
                            await api.delete(`/attendance/${record._id}`);
                            message.success("Record deleted");
                            fetchAttendance();
                        } catch {
                            message.error("Failed to delete");
                        }
                    }}
                >
                    Delete
                </Button>
            )
        }
    ];

    const facultyColumns = [
        { title: 'Date', dataIndex: 'date' },
        { title: 'Name', dataIndex: 'student_name' },
        { title: 'Status', dataIndex: 'status' },
        { title: 'Check In', dataIndex: 'check_in' },
        { title: 'Check Out', dataIndex: 'check_out' },
        { 
            title: 'Action', 
            key: 'action',
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => (
                <Button danger size="small" onClick={async () => {
                    await api.delete(`/attendance/${record._id}`);
                    fetchAttendance();
                }}>Delete</Button>
            )
        }
    ];
    
    const absentColumns = [
        { title: 'Name', dataIndex: 'name' },
        { title: 'Class', dataIndex: 'class_section' },
        { title: 'Role', dataIndex: 'role' },
        { title: 'Status', dataIndex: 'status', render: (s:string) => <Tag color="red">{s.toUpperCase()}</Tag> },
    ];

    return (
         <div>
            <h2>Attendance Reports</h2>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div>
                        <label style={{ marginRight: 8 }}>Date: </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }} 
                        />
                    </div>
                </div>
                <Button 
                    type="primary" 
                    onClick={() => {
                        window.open(`http://localhost:8000/reports/export?date=${date}`, '_blank');
                    }}
                >
                    Export to Excel
                </Button>
            </div>
            
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                {
                    key: '1',
                    label: 'Students (Present)',
                    children: (
                        <div>
                             <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                                <div>
                                    <label style={{ marginRight: 8 }}>Session: </label>
                                    <Radio.Group value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                                        <Radio.Button value="All">All</Radio.Button>
                                        <Radio.Button value="Morning">Morning</Radio.Button>
                                        <Radio.Button value="Lunch">Lunch</Radio.Button>
                                    </Radio.Group>
                                </div>
                                <div>
                                    <label style={{ marginRight: 8 }}>Filter by Subject: </label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter subject..."
                                        value={subjectFilter}
                                        onChange={e => setSubjectFilter(e.target.value)}
                                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                                    />
                                </div>
                             </div>
                             <Table loading={loading} dataSource={filteredStudents} columns={studentColumns} rowKey="_id" />
                        </div>
                    )
                },
                {
                    key: '3', // New Absent Tab
                    label: 'Students (Absent)',
                    children: (
                        <div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ marginRight: 8 }}>Absent Period: </label>
                                <Radio.Group value={absentPeriod} onChange={(e) => setAbsentPeriod(e.target.value)}>
                                    <Radio.Button value="full_day">Whole Day</Radio.Button>
                                    <Radio.Button value="morning">Morning</Radio.Button>
                                    <Radio.Button value="lunch">Lunch</Radio.Button>
                                </Radio.Group>
                            </div>
                            <Table loading={loading} dataSource={absentStudents} columns={absentColumns} rowKey="_id" />
                        </div>
                    )
                },
                {
                    key: '2',
                    label: 'Faculty',
                    children: <Table loading={loading} dataSource={facultyData} columns={facultyColumns} rowKey="_id" />
                }
            ]} />
         </div>
    );
};
export default ReportsPage;
