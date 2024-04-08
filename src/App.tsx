import './App.css';

import { Button, Flex, Input, message } from 'antd';
import {
    ClockCircleOutlined,
    LogoutOutlined,
    PhoneFilled,
    UserOutlined,
} from '@ant-design/icons';

import JsSIP, { UA } from 'jssip';
import { useEffect, useRef, useState } from 'react';
import {
    formatDate,
    formatDuration,
    startPlayAudio,
    stopPlayAudio,
} from './callUtils';

import { CallLogList } from './phone/CallLogList';
import { IncomingRTCSessionEvent } from 'jssip/lib/UA';

import { RTCSession } from 'jssip/lib/RTCSession';
import ringTone from '../public/NokiaTune.mp3';
import Auth from './components/Auth';

export const callStatuses = {
    idle: '',
    calling: 'вызов',
    inCall: 'разговор',
    ended: 'завершено',
};

export interface ICallData {
    isIncoming: boolean;
    name: string;
    date: string;
    number: string;
    success: boolean;
}

interface IFormValues {
    login: string;
    server: string;
    password: string;
}

const App = () => {
    const [loading, setLoading] = useState(false);
    const [number, setNumber] = useState('');
    const [incomingNumber, setIncomingNumber] = useState('');
    const [sipPhone, setSipPhone] = useState<UA | null>(null);
    const [activeSession, setActiveSession] = useState<RTCSession | null>(null);
    const [callLog, setCallLog] = useState<ICallData[]>([]);
    const [callStatus, setCallStatus] = useState(callStatuses.idle);
    const [callDuration, setCallDuration] = useState(0);
    const [startTimer, setStartTimer] = useState(false);
    const [currentUser, setCurrentUser] = useState<string>('');

    const addCallLog = (callData: ICallData) => {
        setCallLog((prevLog) => [...prevLog, callData]);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNumber(e.target.value);
    };

    const resetCall = () => {
        setTimeout(() => {
            setCallStatus(callStatuses.idle);
        }, 2000);
        setActiveSession(null);
        setCallDuration(0);
        setStartTimer(false);
        setCallStatus(callStatuses.ended);
        setNumber('');
        setIncomingNumber('');
    };

    const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    const createCallData = (
        isIncoming: boolean,
        name: string,
        number: string,
        success: boolean
    ) => ({
        isIncoming: isIncoming,
        name: name,
        date: formatDate(new Date()),
        number: number,
        success: success,
    });

    const makeCall = (number: string) => {
        console.log('makeCall start');
        if (!sipPhone) return;
        console.log('Calling...', number);
        setCallStatus(callStatuses.calling);
        setStartTimer(true);
        setNumber(number);

        const options = {
            mediaConstraints: { audio: true, video: false },
            rtcOfferConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            },

            eventHandlers: {
                peerconnection: (data: any) => {
                    console.log('peerconnection', data);
                    const peerconnection = data.peerconnection;

                    peerconnection.onaddstream = (e: any) => {
                        console.log('add stream', e);
                        if (remoteAudioRef.current) {
                            const remoteAudio = remoteAudioRef.current;
                            remoteAudio.srcObject = e.stream;
                            remoteAudio.play();
                        }

                        // const stream = new MediaStream();
                        // console.log(peerconnection.getReceivers());
                        // peerconnection
                        //     .getReceivers()
                        //     .forEach(function (receiver: any) {
                        //         console.log(receiver);
                        //         stream.addTrack(receiver.track);
                        //     });
                    };
                },

                progress: () => {
                    console.log('идет вызов');
                },
                failed: (e: any) => {
                    console.error('исх Call failed:', e);
                    addCallLog(createCallData(false, '', number, false));
                    resetCall();
                },
                ended: () => {
                    console.log('исх Call ended');

                    addCallLog(createCallData(false, '', number, true));
                    resetCall();
                },
                confirmed: () => {
                    console.log('исходящий вызов принят');
                    setCallStatus(callStatuses.inCall);
                    setCallDuration(0);
                    setStartTimer(true);
                },
            },
        };

        const session = sipPhone.call(`sip:${number}@voip.uiscom.ru`, options);
        console.log('set active session make call', session);
        setActiveSession(session);
    };

    const answerCall = () => {
        if (activeSession?.direction === 'outgoing') return;

        const options = {
            mediaConstraints: { audio: true, video: false },
        };

        activeSession?.answer(options);

        setCallStatus(callStatuses.inCall);
    };

    const endCall = () => {
        console.log(
            'функция endCall, callStatus: ',
            callStatus,
            'activeCall: ',
            activeSession
        );
        activeSession?.terminate();
    };

    const registerToSipServer = ({ login, server, password }: IFormValues) => {
        console.log('registerToSipServer', login, server, password);
        setLoading(true);
        console.log('registerToSipServer');
        // const hardcodedLogin = '0344900';
        // const hardcodedServer = 'voip.uiscom.ru';
        // const hardcodedPassword = 'bzTeHwYVs9';

        const socket = new JsSIP.WebSocketInterface(`wss://${server}`);
        const configuration = {
            sockets: [socket],
            uri: `sip:${login}@${server}`,
            password: password,
        };

        const phone = new JsSIP.UA(configuration);
        setSipPhone(phone);
        phone.start();

        phone.on('registered', () => {
            console.log('Registered');
            // setIsAuth(true);
            message.success('Зарегистрирован', 3);
            setLoading(false);
            setCurrentUser(`${login}@${server}`);
        });
        phone.on('unregistered', () => {
            console.log('logout');
            setCurrentUser('');
        });
        phone.on('registrationFailed', (data: any) => {
            console.error('Registration failed:', data);
            message.error('Ошибка при регистрации');
            setLoading(false);
        });
        phone.on('disconnected', () => {
            console.log('Отключение от SIP-сервера');
        });
        phone.on('newRTCSession', (data: IncomingRTCSessionEvent) => {
            const { originator, session } = data;

            session.on('peerconnection', (data: any) => {
                console.log('peerconnection in', data);
                const peerconnection = data.peerconnection;

                peerconnection.onaddstream = (e: any) => {
                    console.log('add stream in', e);

                    if (remoteAudioRef.current) {
                        console.log('remote audio already exists');
                        const remoteAudio = remoteAudioRef.current;
                        remoteAudio.srcObject = e.stream;
                        console.log('включаю play');
                        remoteAudio.play();
                    }

                    const stream = new MediaStream();
                    console.log(
                        'new MediaStream',
                        peerconnection.getReceivers()
                    );
                    peerconnection
                        .getReceivers()
                        .forEach(function (receiver: any) {
                            console.log('receiver', receiver);
                            stream.addTrack(receiver.track);
                        });
                };
            });

            if (originator === 'remote') {
                console.log('Incoming call');
                setCallStatus(callStatuses.calling);
                console.log('play ringtone');
                startPlayAudio(ringtoneAudioRef);
                setIncomingNumber(session.remote_identity.uri.user);

                setActiveSession(session);
                session.on('failed', () => {
                    console.error('Incoming call failed');

                    stopPlayAudio(ringtoneAudioRef);
                    addCallLog(
                        createCallData(
                            true,
                            session.remote_identity.display_name,
                            session.remote_identity.uri.user,
                            false
                        )
                    );
                    resetCall();
                });

                session.on('confirmed', () => {
                    setCallStatus(callStatuses.inCall);
                    console.log('Incoming call confirmed');
                    setCallDuration(0);
                    setStartTimer(true);
                    stopPlayAudio(ringtoneAudioRef);
                });
                session.on('ended', () => {
                    addCallLog(
                        createCallData(
                            true,
                            session.remote_identity.display_name,
                            session.remote_identity.uri.user,
                            true
                        )
                    );
                    resetCall();
                });
                session.on('progress', () => {
                    console.log('incoming progress');
                    setStartTimer(true);
                });
            }
        });
    };

    const handleLogout = () => {
        sipPhone?.terminateSessions();
        sipPhone?.unregister();

        setCurrentUser('');
        setSipPhone(null);
        resetCall();
        setCallLog([]);
        localStorage.removeItem(`callLog_${currentUser}`);
    };

    useEffect(() => {
        let duration: number;
        if (startTimer) {
            duration = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (duration) clearInterval(duration);
        };
    }, [startTimer]);

    useEffect(() => {
        if (currentUser) {
            const userCallLogData = localStorage.getItem(
                `callLog_${currentUser}`
            );
            const userCallLog = userCallLogData
                ? JSON.parse(userCallLogData)
                : [];
            setCallLog(userCallLog);
            console.log('user calllog', userCallLog);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(
                `callLog_${currentUser}`,
                JSON.stringify(callLog)
            );
        }
    }, [callLog, currentUser]);

    return (
        <Flex
            vertical
            gap={10}
            style={{
                width: '350px',
                maxHeight: '420px',
                padding: '10px',
                overflow: 'auto',
            }}
        >
            {currentUser ? (
                <>
                    <Flex align='center' justify='space-between'>
                        <p style={{ fontWeight: 'bold', lineHeight: 1 }}>
                            {currentUser}
                        </p>
                        <Button
                            type='link'
                            onClick={handleLogout}
                            icon={<LogoutOutlined />}
                        />
                    </Flex>
                    <Flex justify='center'>
                        <div
                            style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: 'blue',
                                lineHeight: 1,
                                height: '18px',
                            }}
                        >
                            {callStatus}
                        </div>
                    </Flex>
                    <Flex
                        justify='space-between'
                        align='center'
                        style={{ padding: '6px 10px' }}
                    >
                        <Flex align='center' gap={4}>
                            {' '}
                            <UserOutlined />
                        </Flex>

                        <p>{number || incomingNumber}</p>
                        <Flex gap={5}>
                            {' '}
                            <ClockCircleOutlined />
                            {formatDuration(callDuration)}
                        </Flex>
                    </Flex>

                    <>
                        <Input
                            placeholder='введите номер'
                            value={number}
                            onChange={handleNumberChange}
                            disabled={callStatus !== callStatuses.idle}
                        />
                        {(callStatus === callStatuses.idle ||
                            callStatus === callStatuses.ended) && (
                            <Button
                                block
                                style={{
                                    background: 'lightgreen',
                                    color: 'white',
                                    padding: '5px 0',
                                }}
                                icon={<PhoneFilled />}
                                onClick={() => makeCall(number)}
                                disabled={!number}
                            />
                        )}
                        <Flex justify='center' align='center' gap={8}>
                            {callStatus === callStatuses.calling &&
                                activeSession?.direction === 'incoming' && (
                                    <Button
                                        style={{
                                            width: '50%',
                                            background: 'lightgreen',
                                        }}
                                        className='answer-btn'
                                        type='primary'
                                        onClick={answerCall}
                                        disabled={!activeSession}
                                        icon={<PhoneFilled />}
                                    />
                                )}

                            {(callStatus === callStatuses.calling ||
                                callStatus === callStatuses.inCall) && (
                                <Button
                                    style={{ width: '50%' }}
                                    type='primary'
                                    danger
                                    onClick={endCall}
                                    icon={<PhoneFilled rotate={-120} />}
                                />
                            )}
                        </Flex>
                    </>

                    <div>
                        <CallLogList
                            callLog={callLog}
                            makeCall={makeCall}
                            callStatus={callStatus}
                        />

                        <audio ref={ringtoneAudioRef} src={ringTone} loop />
                        <audio ref={remoteAudioRef} autoPlay />
                    </div>
                </>
            ) : (
                <div style={{ padding: '10px' }}>
                    <Auth loading={loading} onFinish={registerToSipServer} />
                </div>
            )}
        </Flex>
    );
};

export default App;
