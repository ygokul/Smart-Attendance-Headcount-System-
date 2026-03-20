import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { confirm } = Modal;

const DepartmentsPage: React.FC = () => {
    const [departments, setDepartments] = useState([]);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/departments/');
            setDepartments(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateOrUpdate = async (values: any) => {
        try {
            if (editingDept) {
                await api.put(`/departments/${editingDept._id}`, values);
                message.success("Department updated");
            } else {
                await api.post('/departments/', values);
                message.success("Department added");
            }
            setVisible(false);
            setEditingDept(null);
            form.resetFields();
            fetchData();
        } catch (e) {
            message.error("Operation failed");
        }
    };

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: `Delete Department ${name}?`,
            icon: <ExclamationCircleOutlined />,
            content: 'This will not delete associated users or classes, but might affect display.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/departments/${id}`);
                    message.success('Department deleted');
                    fetchData();
                } catch (e) {
                    message.error('Failed to delete department');
                }
            }
        });
    };

    const openEditModal = (record: any) => {
        setEditingDept(record);
        form.setFieldsValue(record);
        setVisible(true);
    };

    const openAddModal = () => {
        setEditingDept(null);
        form.resetFields();
        setVisible(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Departments</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add Department</Button>
            </div>
            
            <Table 
                dataSource={departments} 
                loading={loading}
                rowKey="_id" 
                columns={[
                { title: 'Department Name', dataIndex: 'name' },
                { title: 'Code', dataIndex: 'code' },
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
            
            <Modal title={editingDept ? "Edit Department" : "Add Department"} open={visible} onCancel={() => setVisible(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
                    <Form.Item name="name" label="Department Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Computer Science" />
                    </Form.Item>
                    <Form.Item name="code" label="Department Code" rules={[{ required: true }]}>
                        <Input placeholder="e.g. CS" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default DepartmentsPage;
