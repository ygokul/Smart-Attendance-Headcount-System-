import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Tabs, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import { Link } from 'react-router-dom';

const { confirm } = Modal;
const { Option } = Select;

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes, classesRes] = await Promise.all([
                api.get('/users/'),
                api.get('/departments/'),
                api.get('/classes/')
            ]);
            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
            setClasses(classesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (id: string, name: string) => {
        confirm({
            title: `Are you sure delete user ${name}?`,
            icon: <ExclamationCircleOutlined />,
            content: 'This action cannot be undone.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    message.success('User deleted successfully');
                    fetchData();
                } catch (error) {
                    message.error('Failed to delete user');
                }
            },
        });
    };

    const handleEdit = (record: any) => {
        setEditingUser(record);
        form.setFieldsValue(record);
        setEditModalVisible(true);
    };

    const handleUpdate = async (values: any) => {
        try {
            await api.put(`/users/${editingUser._id}`, values);
            message.success('User updated successfully');
            setEditModalVisible(false);
            fetchData();
        } catch (error) {
            message.error('Failed to update user');
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'student' ? 'blue' : role === 'faculty' ? 'green' : 'gold'}>
                    {role.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Class/Designation',
            key: 'details',
            render: (_: any, record: any) => (
                <span>{record.class_section || record.designation || '-'}</span>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id, record.name)} />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>User Management</h2>
                <Link to="/admin/users/create">
                    <Button type="primary" icon={<PlusOutlined />}>Add User</Button>
                </Link>
            </div>
            
            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'Students',
                    children: <Table loading={loading} dataSource={users.filter(u => u.role === 'student')} columns={columns} rowKey="_id" />
                },
                {
                    key: '2',
                    label: 'Faculty',
                    children: <Table loading={loading} dataSource={users.filter(u => u.role === 'faculty')} columns={columns} rowKey="_id" />
                }
            ]} />

            <Modal
                title="Edit User"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email">
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select disabled>
                             <Option value="student">Student</Option>
                             <Option value="faculty">Faculty</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                         <Select>
                             {departments.map((dept: any) => (
                                 <Option key={dept._id} value={dept.name}>{dept.name}</Option>
                             ))}
                         </Select>
                    </Form.Item>
                    <Form.Item 
                        shouldUpdate 
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const role = getFieldValue('role');
                            return role === 'student' ? (
                                <Form.Item name="class_section" label="Class">
                                     <Select>
                                         {classes.map((cls: any) => (
                                             <Option key={cls._id} value={cls.name}>{cls.name}</Option>
                                         ))}
                                     </Select>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsersPage;
