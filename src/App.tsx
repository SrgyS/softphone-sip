import './App.css';

// export default registerToSipServer;
import JsSIP, { UA } from 'jssip';
import { RefObject, useEffect, useRef, useState } from 'react';

import { IncomingRTCSessionEvent } from 'jssip/lib/UA';
// import { IRegisterValues } from '../../types/types';
import { RTCSession } from 'jssip/lib/RTCSession';
import ringTone from '../public/NokiaTune.mp3';

const callStatuses = {
    idle: '',
    calling: 'вызов',
    inCall: 'разговор',
    ended: 'завершено',
};

interface ICallData {
    isIncoming: boolean;
    name: string;
    date: Date;
    number: string;
    success: boolean;
}

const App = () => {
    const [number, setNumber] = useState('');
    const [sipPhone, setSipPhone] = useState<UA | null>(null);
    const [activeSession, setActiveSession] = useState<RTCSession | null>(null);
    const [callLog, setCallLog] = useState<ICallData[]>([]);
    const [callStatus, setCallStatus] = useState(callStatuses.idle);
    const [callDuration, setCallDuration] = useState(0);
    const [startTimer, setStartTimer] = useState(false);
    const [isAuth, setIsAuth] = useState(false);

    const addCallLog = (callData: ICallData) => {
        setCallLog((prevLog) => [...prevLog, callData]);
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
        date: new Date(),
        number: number,
        success: success,
    });

    const makeCall = () => {
        console.log('makeCall start');
        if (!sipPhone) return;
        console.log('Calling...', number);
        setCallStatus(callStatuses.calling);
        setStartTimer(true);

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
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                    setCallDuration(0);
                    setStartTimer(false);
                },
                ended: () => {
                    console.log('исх Call ended');
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                    setActiveSession(null);
                    addCallLog(createCallData(false, '', number, true));
                    setCallDuration(0);
                    setStartTimer(false);
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

    const rejectCall = () => {
        console.log('отклоняю входящий');
        if (!activeSession) return;
        console.log('отклоняю входящий session');
        activeSession.terminate();
        setCallDuration(0);
        setStartTimer(false);
        setActiveSession(null);
    };

    const handleEndCall = () => {
        console.log(
            'функция endCall, callStatus: ',
            callStatus,
            'activeCall: ',
            activeSession
        );
        if (callStatus === callStatuses.inCall && activeSession) {
            console.log('завершаю исходящий');
            activeSession.terminate();
            setActiveSession(null);
            setTimeout(() => {
                setCallStatus(callStatuses.idle);
            }, 1500);
            setCallStatus(callStatuses.ended);
            setCallDuration(0);
            setStartTimer(false);
        } else if (callStatus === callStatuses.calling && activeSession) {
            console.log('отменяю исходящий вызов');
            activeSession.terminate();
            setActiveSession(null);
            setTimeout(() => {
                setCallStatus(callStatuses.idle);
            }, 1500);
            setCallStatus(callStatuses.ended);
            setCallDuration(0);
            setStartTimer(false);
        } else if (activeSession) {
            console.log('завершаю входящий');
            rejectCall();
        }
    };

    const registerToSipServer = () => {
        console.log('registerToSipServer');
        const hardcodedLogin = '0344900';
        const hardcodedServer = 'voip.uiscom.ru';
        const hardcodedPassword = 'bzTeHwYVs9';

        const socket = new JsSIP.WebSocketInterface(`wss://${hardcodedServer}`);
        const configuration = {
            sockets: [socket],
            uri: `sip:${hardcodedLogin}@${hardcodedServer}`,
            password: hardcodedPassword,
        };

        const phone = new JsSIP.UA(configuration);
        setSipPhone(phone);
        phone.start();

        phone.on('registered', () => {
            console.log('Registered');
            setIsAuth(true);
            console.log('Set isAuth');
        });
        phone.on('unregistered', () => {
            console.log('logout');
            setIsAuth(false);
        });
        phone.on('registrationFailed', (data: any) =>
            console.error('Registration failed:', data)
        );
        phone.on('disconnected', () => {
            console.log('Отключение от SIP-сервера');
            // Дополнительные действия при отключении
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

                setActiveSession(session);
                session.on('failed', () => {
                    console.error('Incoming call failed');
                    setCallDuration(0);
                    setStartTimer(false);
                    stopPlayAudio(ringtoneAudioRef);
                    addCallLog(
                        createCallData(
                            true,
                            session.remote_identity.display_name,
                            session.remote_identity.uri.user,
                            false
                        )
                    );
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                });

                session.on('confirmed', () => {
                    setCallStatus(callStatuses.inCall);
                    console.log('Incoming call confirmed');
                    setCallDuration(0);
                    setStartTimer(true);
                    stopPlayAudio(ringtoneAudioRef);
                });
                session.on('ended', () => {
                    console.log('Incoming call ended');
                    setCallDuration(0);
                    setStartTimer(false);
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                    addCallLog(
                        createCallData(
                            true,
                            session.remote_identity.display_name,
                            session.remote_identity.uri.user,
                            true
                        )
                    );
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
        setIsAuth(false);
        setSipPhone(null);
    };
    const startPlayAudio = (ref: RefObject<HTMLAudioElement>) => {
        if (ref.current) {
            ref.current.play();
            console.log('play audio');
        }
    };

    const stopPlayAudio = (ref: RefObject<HTMLAudioElement>) => {
        if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
        }
    };

    useEffect(() => {
        console.log('use Effect isAuth', isAuth);
        let duration: number;
        if (startTimer) {
            duration = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (duration) clearInterval(duration);
        };
    }, [startTimer, isAuth]);

    return (
        <div>
            <h1>SIPhone</h1>

            {isAuth ? (
                <div>
                    <button onClick={handleLogout}>выйти</button>
                    <div>{callStatus}</div>
                    <div>{callDuration}</div>
                    <div>
                        <input
                            type='text'
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                        />
                        <button onClick={makeCall}>Call</button>
                    </div>
                    <div>
                        <button onClick={answerCall} disabled={!activeSession}>
                            Ответить
                        </button>
                        <button onClick={rejectCall} disabled={!activeSession}>
                            Отклонить
                        </button>
                        <button onClick={handleEndCall}>Завершить</button>
                    </div>
                    <div>
                        {callLog.map((item) => (
                            <div key={item.date.toString()} onClick={makeCall}>
                                <p>Имя: {item.name}</p>
                                <p>Номер: {item.number}</p>
                                <p>Дата: {item.date.toISOString()}</p>
                            </div>
                        ))}
                        <audio ref={ringtoneAudioRef} src={ringTone} loop />
                        <audio ref={remoteAudioRef} autoPlay />
                    </div>
                </div>
            ) : (
                <div>
                    <input placeholder='login' />
                    <input placeholder='server' />
                    <input placeholder='password' />
                    <button onClick={registerToSipServer}>Register</button>
                </div>
            )}
        </div>
    );
};

export default App;
