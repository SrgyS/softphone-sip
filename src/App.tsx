import './App.css';

import { Dispatch, SetStateAction, useState } from 'react';
import { IncomingRTCSessionEvent, RTCSessionListener } from 'jssip/lib/UA';
// export default registerToSipServer;
import JsSIP, { UA } from 'jssip';

import { IRegisterValues } from '../../types/types';
import { RTCSession } from 'jssip/lib/RTCSession';

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
    const [incomingSession, setIncomingSession] = useState<RTCSession | null>(
        null
    );
    const [activeCall, setActiveCall] = useState<RTCSession | null>(null);
    const [callLog, setCallLog] = useState<ICallData[]>([]);
    const [callStatus, setCallStatus] = useState(callStatuses.idle);

    const addCallLog = (callData: ICallData) => {
        setCallLog((prevLog) => [...prevLog, callData]);
    };

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
        if (!sipPhone) return;
        console.log('Calling...', number);
        setCallStatus(callStatuses.calling);

        const options = {
            mediaConstraints: { audio: true, video: false },
            rtcOfferConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            },

            eventHandlers: {
                progress: () => console.log('идет вызов'),
                failed: (e: any) => {
                    console.error('исх Call failed:', e);
                    addCallLog(createCallData(false, '', number, false));
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                },
                ended: () => {
                    console.log('исх Call ended');
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                    setActiveCall(null);
                    addCallLog(createCallData(false, '', number, true));
                },
                confirmed: () => {
                    console.log('исходящий вызов принят');
                    setCallStatus(callStatuses.inCall);
                },
            },
        };

        const session = sipPhone.call(`sip:${number}@voip.uiscom.ru`, options);
        setActiveCall(session);
    };

    const answerCall = () => {
        if (!incomingSession) return;

        const options = {
            mediaConstraints: { audio: true, video: false },
        };

        incomingSession.answer(options);
        setCallStatus(callStatuses.inCall);
        // const callData: ICallData = {
        //     isIncoming: true,
        //     name: incomingSession.remote_identity.display_name || '',
        //     date: new Date(),
        //     number: incomingSession.remote_identity.uri.user,
        //     success: true,
        // };
        // addCallLog(callData);
    };

    const rejectCall = () => {
        if (!incomingSession) return;

        incomingSession.terminate();
    };

    const handleEndCall = () => {
        console.log(
            'функция endCall, callStatus: ',
            callStatus,
            'activeCall: ',
            activeCall
        );
        if (callStatus === callStatuses.inCall && activeCall) {
            console.log('завершаю исходящий');
            activeCall.terminate();
            setActiveCall(null);
            setTimeout(() => {
                setCallStatus(callStatuses.idle);
            }, 1500);
            setCallStatus(callStatuses.ended);
        } else if (callStatus === callStatuses.calling && activeCall) {
            console.log('отменяю исходящий вызов');
            activeCall.terminate();
            setActiveCall(null);
            setTimeout(() => {
                setCallStatus(callStatuses.idle);
            }, 1500);
            setCallStatus(callStatuses.ended);
        } else if (incomingSession) {
            console.log('завершаю входящий');
            rejectCall();
        }
    };

    const registerToSipServer = () => {
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

        phone.on('registered', () => console.log('Registered'));
        phone.on('registrationFailed', (data: any) =>
            console.error('Registration failed:', data)
        );
        phone.on('newRTCSession', (e: IncomingRTCSessionEvent) => {
            if (e.originator === 'remote') {
                console.log('Incoming call');
                setCallStatus(callStatuses.calling);
                console.log('in number', e.session.remote_identity.uri.user);

                // const callData: ICallData = {
                //     isIncoming: true,
                //     name: e.session.remote_identity.display_name,
                //     date: new Date(),
                //     number: e.session.remote_identity.uri.user,
                //     success: false,
                // };

                setIncomingSession(e.session);
                e.session.on('failed', () => {
                    console.error('Incoming call failed');
                    addCallLog(
                        createCallData(
                            true,
                            e.session.remote_identity.display_name,
                            e.session.remote_identity.uri.user,
                            false
                        )
                    );
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                });

                e.session.on('confirmed', () => {
                    setCallStatus(callStatuses.inCall);
                    console.log('Incoming call confirmed');
                });
                e.session.on('ended', () => {
                    console.log('Incoming call ended');
                    setTimeout(() => {
                        setCallStatus(callStatuses.idle);
                    }, 1500);
                    setCallStatus(callStatuses.ended);
                    addCallLog(
                        createCallData(
                            true,
                            e.session.remote_identity.display_name,
                            e.session.remote_identity.uri.user,
                            true
                        )
                    );
                });
                e.session.on('progress', () => {
                    console.log('incoming progress');
                });
            }
        });

        phone.start();
    };

    return (
        <div>
            <h1>React JsSIP Example</h1>
            <div>{callStatus}</div>
            <div>
                <input
                    type='text'
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                />
                <button onClick={makeCall}>Call</button>
            </div>
            <div>
                <button onClick={registerToSipServer}>Register</button>
                <button onClick={answerCall} disabled={!incomingSession}>
                    Ответить
                </button>
                <button onClick={rejectCall} disabled={!incomingSession}>
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
            </div>
        </div>
    );
};

export default App;
