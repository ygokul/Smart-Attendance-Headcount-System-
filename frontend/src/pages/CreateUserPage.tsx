import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Row, Col, Image } from 'antd';
import Webcam from 'react-webcam';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const CreateUserPage: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        api.get('/departments/').then(res => setDepartments(res.data)).catch(console.error);
        api.get('/classes/').then(res => setClasses(res.data)).catch(console.error);
    }, []);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            if (capturedImages.length >= 5) {
                message.warning("Maximum 5 images allowed");
                return;
            }
            setCapturedImages(prev => [...prev, imageSrc]);
        }
    }, [webcamRef, capturedImages]);

    const handleFinish = async (values: any) => {
        if (capturedImages.length === 0) {
            message.error("Please capture at least one image");
            return;
        }

        setLoading(true);
        try {
            // 1. Create User
            const userRes = await api.post('/users/', values);
            const userId = userRes.data._id;
            message.success("User created. Uploading faces...");

            // 2. Upload Faces
            for (const [index, imgBase64] of capturedImages.entries()) {
                // Convert base64 to blob
                const res = await fetch(imgBase64);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('file', blob, `face_${index}.jpg`);

                await api.post(`/face/register/${userId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            message.success("User created successfully! Ready for next registration.");
            form.resetFields();
            setCapturedImages([]);
            // navigate('/users');
        } catch (error) {
            console.error(error);
            message.error("Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row gutter={24}>
            <Col span={12}>
                <Card title="User Details">
                    <Form form={form} layout="vertical" onFinish={handleFinish}>
                        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="email" label="Email">
                            <Input type="email" />
                        </Form.Item>
                        <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="student">
                            <Select>
                                <Option value="student">Student</Option>
                                <Option value="faculty">Faculty</Option>
                            </Select>
                        </Form.Item>
                        
                        <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                             <Select placeholder="Select Department">
                                 {departments.map((dept: any) => (
                                     <Option key={dept._id} value={dept.name}>{dept.name}</Option>
                                 ))}
                             </Select>
                        </Form.Item>
                        <Form.Item name="class_section" label="Class/Section (Students)">
                             <Select placeholder="Select Class">
                                 {classes.map((cls: any) => (
                                     <Option key={cls._id} value={cls.name}>{cls.name}</Option>
                                 ))}
                             </Select>
                        </Form.Item>

                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Create User & Register Faces
                        </Button>
                    </Form>
                </Card>
            </Col>
            <Col span={12}>
                <Card title="Face Registration">
                    <div style={{ marginBottom: 16 }}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width="100%"
                        />
                    </div>
                    <Button onClick={capture} block disabled={capturedImages.length >= 5}>
                        Capture Photo ({capturedImages.length}/5)
                    </Button>
                    
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {capturedImages.map((img, idx) => (
                            <Image key={idx} width={80} src={img} />
                        ))}
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default CreateUserPage;
