import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Typography, Input, Button, message } from 'antd';
import { sortPagesSmartly } from '../utils/smartSort';
import './main.css';

const { TextArea } = Input;
const { Text } = Typography;

const App: React.FC = () => {
    const [currentList, setCurrentList] = useState<string[]>([]);
    const [targetList, setTargetList] = useState<string>('');

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
                <div className="footer-container" style={{ justifyContent: 'flex-end' }}>
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

        </ConfigProvider>
    );
};

export default App;
