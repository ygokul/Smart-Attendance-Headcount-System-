import React, { useEffect, useState } from 'react';
import { Card, Form, TimePicker, Button, message, Divider, Typography, Row, Col } from 'antd';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const SettingsPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            const data = res.data;
            
            // Convert strings to dayjs objects for TimePicker
            const formData = {
                student_morning_start: dayjs(data.student.morning.start, 'HH:mm'),
                student_morning_end: dayjs(data.student.morning.end, 'HH:mm'),
                student_lunch_start: dayjs(data.student.lunch.start, 'HH:mm'),
                student_lunch_end: dayjs(data.student.lunch.end, 'HH:mm'),
                
                faculty_morning_start: dayjs(data.faculty.morning.start, 'HH:mm'),
                faculty_morning_end: dayjs(data.faculty.morning.end, 'HH:mm'),
                faculty_out_start: data.faculty.out_time ? dayjs(data.faculty.out_time.start, 'HH:mm') : null,
                faculty_out_end: data.faculty.out_time ? dayjs(data.faculty.out_time.end, 'HH:mm') : null,
            };
            
            form.setFieldsValue(formData);
        } catch {
            message.error("Failed to load settings");
        }
    };

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onFinish = async (values: {
        student_morning_start: dayjs.Dayjs;
        student_morning_end: dayjs.Dayjs;
        student_lunch_start: dayjs.Dayjs;
        student_lunch_end: dayjs.Dayjs;
        faculty_morning_start: dayjs.Dayjs;
        faculty_morning_end: dayjs.Dayjs;
        faculty_out_start: dayjs.Dayjs;
        faculty_out_end: dayjs.Dayjs;
    }) => {
        setLoading(true);
        try {
            // Convert dayjs back to HH:mm strings
            const payload = {
                student: {
                    morning: {
                        start: values.student_morning_start.format('HH:mm'),
                        end: values.student_morning_end.format('HH:mm'),
                    },
                    lunch: {
                        start: values.student_lunch_start.format('HH:mm'),
                        end: values.student_lunch_end.format('HH:mm'),
                    }
                },
                faculty: {
                    morning: {
                        start: values.faculty_morning_start.format('HH:mm'),
                        end: values.faculty_morning_end.format('HH:mm'),
                    },
                    lunch: null,
                    out_time: {
                        start: values.faculty_out_start.format('HH:mm'),
                        end: values.faculty_out_end.format('HH:mm'),
                    }
                }
            };
            
            await api.put('/settings', payload);
            message.success("Settings updated successfully");
        } catch {
            message.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Title level={2}>Attendance Settings</Title>
            <Card title="Attendance Timings" bordered={false}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Divider>Student Timings</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Morning Slot Start" name="student_morning_start" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Morning Slot End" name="student_morning_end" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Lunch Slot Start" name="student_lunch_start" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Lunch Slot End" name="student_lunch_end" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider>Faculty Timings</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Morning Check-in Start" name="faculty_morning_start" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Morning Check-in End" name="faculty_morning_end" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Evening Check-out Start" name="faculty_out_start" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Evening Check-out End" name="faculty_out_end" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default SettingsPage;
