import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, Row, Col, Typography, Badge, Avatar, Button } from 'antd';
import { UserOutlined, CheckCircleFilled, ScanOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const AttendanceScanner: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [lastDetection, setLastDetection] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    const navigate = useNavigate();

    const captureAndScan = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsScanning(true);
        try {
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const formData = new FormData();
            formData.append('file', blob, 'scan.jpg');

            const response = await api.post('/attendance/mark', formData, {
                 headers: { 'Content-Type': 'multipart/form-data' }
            });

            setLastDetection({
                success: true,
                message: response.data.message,
                user: response.data.user,
                status: response.data.status,
                subject: response.data.subject,
                timestamp: new Date().toLocaleTimeString()
            });
            
            // Clear detection after 4 seconds for next person visual cue
            setTimeout(() => {
                // optional: could clear or keep history
            }, 4000);

        } catch (error: any) {
            // calculated silence, or handle specific errors
        } finally {
            setIsScanning(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(captureAndScan, 2000); // Scans every 2 seconds
        return () => clearInterval(interval);
    }, [captureAndScan]);

    return (
        <div style={{ 
            height: '100vh', 
            width: '100vw',
            overflow: 'hidden',
            background: '#0f172a', // Slate 900
            backgroundImage: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Back Button */}
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined style={{ fontSize: 24, color: 'white' }} />} 
                style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}
                onClick={() => navigate('/')}
            />

            <div style={{ 
                width: '100%', 
                maxWidth: 1200, 
                background: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(20px)',
                borderRadius: 24,
                padding: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                        <ScanOutlined style={{ marginRight: 12, color: '#38bdf8' }} />
                        Attendance Scanner
                    </Title>
                    <Text style={{ color: '#94a3b8' }}>Please look at the camera to mark your attendance</Text>
                </div>

                <Row gutter={[48, 24]} align="middle">
                    <Col xs={24} md={14}>
                         <div style={{ 
                             position: 'relative', 
                             borderRadius: 20, 
                             overflow: 'hidden', 
                             boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.4)',
                             background: '#000'
                         }}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width="100%"
                                height="100%"
                                videoConstraints={{ facingMode: "user" }}
                                style={{ display: 'block', opacity: 0.9 }}
                            />
                            {/* Scanning Overlay Effect */}
                             <div style={{
                                 position: 'absolute',
                                 top: 0,
                                 left: 0,
                                 right: 0,
                                 bottom: 0,
                                 background: isScanning 
                                    ? 'linear-gradient(to bottom, transparent, rgba(56, 189, 248, 0.2), transparent)' 
                                    : 'transparent',
                                 transition: 'background 0.3s',
                                 pointerEvents: 'none'
                             }} />
                             <div className="scan-line" style={{
                                 position: 'absolute',
                                 top: '50%',
                                 left: 0,
                                 right: 0,
                                 height: 2,
                                 background: '#38bdf8',
                                 boxShadow: '0 0 20px #38bdf8',
                                 opacity: 0.8
                             }} />
                         </div>
                    </Col>
                    <Col xs={24} md={10}>
                        <Card 
                            bordered={false} 
                            style={{ 
                                height: '100%', 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: 16,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {!lastDetection ? (
                                <div style={{ padding: 40, opacity: 0.5 }}>
                                    <ScanOutlined style={{ fontSize: 48, color: '#475569', marginBottom: 16 }} />
                                    <Title level={4} style={{ color: '#64748b' }}>Waiting for face...</Title>
                                </div>
                            ) : (
                                <div className="fade-in">
                                    <Avatar 
                                        size={100} 
                                        icon={<UserOutlined />} 
                                        style={{ backgroundColor: '#0ea5e9', marginBottom: 20, boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }} 
                                    />
                                    <Title level={3} style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>
                                        {lastDetection.user}
                                    </Title>
                                    
                                    <div style={{ marginTop: 24, textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <Text style={{ color: '#94a3b8' }}>Status</Text>
                                            <Badge 
                                                status={lastDetection.success && lastDetection.status === 'present' ? 'success' : 'warning'} 
                                                text={<span style={{ color: '#e2e8f0' }}>{lastDetection.message}</span>} 
                                            />
                                        </div>
                                        {lastDetection.subject && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <Text style={{ color: '#94a3b8' }}>Subject</Text>
                                                <Text strong style={{ color: '#38bdf8' }}>{lastDetection.subject}</Text>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text style={{ color: '#94a3b8' }}>Time</Text>
                                            <Text code style={{ background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', border: 'none' }}>{lastDetection.timestamp}</Text>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 24, color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircleFilled style={{ fontSize: 24, verticalAlign: 'middle', marginRight: 8 }} />
                                        <Text strong style={{ color: '#4ade80' }}>Scan Complete</Text>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .scan-line {
                    animation: scan 2.5s infinite linear;
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AttendanceScanner;
