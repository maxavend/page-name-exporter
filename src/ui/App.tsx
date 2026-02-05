import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Typography, Input, Button, Modal, message } from 'antd';
import { sortPagesSmartly } from '../utils/smartSort';
import './main.css';

const { TextArea } = Input;
const { Text } = Typography;

const App: React.FC = () => {
    const [currentList, setCurrentList] = useState<string[]>([]);
    const [targetList, setTargetList] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<string[]>([]);

    useEffect(() => {
        window.onmessage = (event) => {
            const { type, payload } = event.data.pluginMessage;
            if (type === 'init-pages') {
                setCurrentList(payload);
                if (!targetList) {
                    setTargetList(payload.join('\n'));
                }
            } else if (type === 'reorder-complete') {
                message.success('Pages reordered');
                parent.postMessage({ pluginMessage: { type: 'get-pages' } }, '*');
            } else if (type === 'error') {
                message.error(payload);
            }
        };

        parent.postMessage({ pluginMessage: { type: 'get-pages' } }, '*');
    }, [targetList]);

    const handleSmartSort = () => {
        const lines = targetList.split('\n');
        const sorted = sortPagesSmartly(lines);
        setTargetList(sorted.join('\n'));
        message.info('Smart sort applied');
    };

    const handlePreview = () => {
        const lines = targetList.split('\n').filter(l => l.trim() !== '');
        setPreviewData(lines);
        setModalOpen(true);
    };

    const handleApply = () => {
        const lines = targetList.split('\n').filter(l => l.trim() !== '');
        parent.postMessage({ pluginMessage: { type: 'reorder-pages', names: lines } }, '*');
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    fontFamily: 'Inter, sans-serif',
                    colorPrimary: '#0C8CE9',
                    colorBgBase: '#2C2C2C',
                    colorTextBase: '#FFFFFF',
                    fontSize: 12,
                    borderRadius: 4,
                },
                components: {
                    Button: {
                        colorPrimary: '#0C8CE9',
                        controlHeightSM: 28,
                    },
                }
            }}
        >
            <div className="app-container">

                {/* Main Content Areas */}
                <div className="main-grid">

                    {/* Current Structure Column */}
                    <div className="column-layout">
                        <Text strong style={{ color: '#888', paddingLeft: '4px' }}>Current structure</Text>
                        <div className="custom-scroll" style={{ backgroundColor: '#1E1E1E', borderRadius: '4px' }}>
                            <TextArea
                                value={currentList.join('\n')}
                                readOnly
                                className="readonly-textarea"
                                style={{
                                    height: '100%',
                                    border: 'none',
                                    resize: 'none',
                                    padding: '8px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Target Structure Column */}
                    <div className="column-layout">
                        <div style={{ paddingLeft: '4px' }}>
                            <Text strong>Target structure</Text>
                        </div>
                        <div className="custom-scroll" style={{ backgroundColor: '#383838', borderRadius: '4px' }}>
                            <TextArea
                                value={targetList}
                                onChange={(e) => setTargetList(e.target.value)}
                                className="custom-textarea"
                                style={{
                                    height: '100%',
                                    border: 'none',
                                    resize: 'none',
                                    padding: '8px'
                                }}
                                placeholder="Paste or edit page list..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer with Divider and Hug content buttons */}
                <div className="footer-container">
                    {/* Left: Preview (color=default, variant=filled) */}
                    <Button
                        variant="filled"
                        color="default"
                        onClick={handlePreview}
                    >
                        Preview
                    </Button>

                    {/* Right Group: Smart Sort & Apply Order */}
                    <div className="footer-right-group">
                        <Button
                            variant="filled"
                            color="default"
                            onClick={handleSmartSort}
                        >
                            Smart sort
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleApply}
                        >
                            Apply reorder
                        </Button>
                    </div>
                </div>

            </div>

            <Modal
                title="Preview reorder"
                open={modalOpen}
                onOk={() => setModalOpen(false)}
                onCancel={() => setModalOpen(false)}
                centered
                width={500}
                styles={{
                    mask: { backdropFilter: 'none', backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
                footer={[
                    <Button key="close" variant="filled" color="default" onClick={() => setModalOpen(false)}>Close</Button>,
                    <Button key="apply" type="primary" onClick={() => { setModalOpen(false); handleApply(); }}>Apply now</Button>
                ]}
            >
                <div className="preview-list custom-scroll">
                    {previewData.map((page, idx) => (
                        <div key={idx} className="preview-item">
                            <span className="preview-index">{idx + 1}</span>
                            <span className={`preview-name ${page.startsWith('---') || page === page.toUpperCase() ? 'is-section' : ''}`}>
                                {page}
                            </span>
                        </div>
                    ))}
                </div>
            </Modal>

        </ConfigProvider>
    );
};

export default App;
