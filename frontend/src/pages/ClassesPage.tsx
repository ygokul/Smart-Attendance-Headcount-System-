import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { confirm } = Modal;

const ClassesPage: React.FC = () => {
    const [classes, setClasses] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [form] = Form.useForm();
    const [departments, setDepartments] = useState<any[]>([]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes/');
            setClasses(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments/');
            setDepartments(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchDepartments();
    }, []);

    const handleCreateOrUpdate = async (values: any) => {
        try {
            // Add schedule only for new classes if simpler logic is desired. 
            // For updates, typically we merge or keep existing, but here we'll re-apply default schedule for simplicity 
            // or we could check if schedule exists.
            // For this implementation, let's keep it simple.
            
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const schedule = days.map(day => ({
                day: day,
                periods: [
                    { period_no: 1, subject: "Demo Subject", start_time: "00:00", end_time: "23:59" }
                ]
            }));
            
            const payload = { ...values };
            if (!editingClass) {
                payload.schedule = schedule;
            }

            if (editingClass) {
                await api.put(`/classes/${editingClass._id}`, payload);
                message.success("Class updated");
            } else {
                await api.post('/classes/', payload);
                message.success("Class created");
            }
            setVisible(false);
            setEditingClass(null);
            form.resetFields();
            fetchClasses();
        } catch (e) {
            message.error("Operation failed");
        }
    };

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: `Delete Class ${name}?`,
            icon: <ExclamationCircleOutlined />,
            content: 'This will not delete students in this class, but they might be unassigned.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/classes/${id}`);
                    message.success('Class deleted');
                    fetchClasses();
                } catch (e) {
                    message.error('Failed to delete class');
                }
            }
        });
    };

    const openEditModal = (record: any) => {
        setEditingClass(record);
        form.setFieldsValue(record);
        setVisible(true);
    };

    const openAddModal = () => {
        setEditingClass(null);
        form.resetFields();
        setVisible(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Classes</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add Class</Button>
            </div>
            <Table dataSource={classes} rowKey="_id" columns={[
                { title: 'Class Name', dataIndex: 'name' },
                { title: 'Department', dataIndex: 'department' },
                { title: 'Academic Year', dataIndex: 'academic_year' },
                {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: any) => (
                        <Space>
                            <Button icon={<EditOutlined />} type="text" onClick={() => openEditModal(record)} />
                            <Button icon={<DeleteOutlined />} danger type="text" onClick={() => handleDelete(record._id, record.name)} />
                        </Space>
                    )
                }
            ]} />
            
            <Modal title={editingClass ? "Edit Class" : "Add Class"} open={visible} onCancel={() => setVisible(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
                    <Form.Item name="name" label="Class Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                        <Select placeholder="Select Department">
                            {departments.map((dept: any) => (
                                <Select.Option key={dept._id} value={dept.name}>{dept.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="academic_year" label="Year" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default ClassesPage;
