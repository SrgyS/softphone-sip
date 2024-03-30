import './App.css';

import { Dispatch, SetStateAction, useState } from 'react';
import { IncomingRTCSessionEvent, RTCSessionListener } from 'jssip/lib/UA';
// export default registerToSipServer;
import JsSIP, { UA } from 'jssip';

import { IRegisterValues } from '../../types/types';
import { RTCSession } from 'jssip/lib/RTCSession';

const App = () => {
    const [number, setNumber] = useState('');
    const [sipPhone, setSipPhone] = useState<UA | null>(null);
    const [incomingSession, setIncomingSession] = useState<any | null>(null);
    const [callLog, setCallLog] = useState<string[]>([]);

    const addCallLog = (callNumber: string) => {
        setCallLog((prevLog) => [...prevLog, callNumber]);
    };

    const makeCall = () => {
        if (!sipPhone) return;
        console.log('Calling...', number);

        const options = {
            mediaConstraints: { audio: true, video: false },
            rtcOfferConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            },

            eventHandlers: {
                progress: () => console.log('идет вызов'),
                failed: (e: any) => console.error('Call failed:', e),
                ended: () => console.log('Call ended'),
            },
        };

        sipPhone.call(`sip:${number}@voip.uiscom.ru`, options);
    };

    const answerCall = () => {
        if (!incomingSession) return;

        const options = {
            mediaConstraints: { audio: true, video: false },
        };

        incomingSession.answer(options);
    };

    const rejectCall = () => {
        if (!incomingSession) return;
        incomingSession.terminate();
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
                console.log('in number', e.session.remote_identity.uri.user);
                const number = e.session.remote_identity.uri.user;
                setIncomingSession(e.session);
                e.session.on('failed', () => {
                    console.error('Incoming call failed');
                    addCallLog(number);
                });

                e.session.on('confirmed', () =>
                    console.log('Incoming call confirmed')
                );
                e.session.on('ended', () => console.log('Incoming call ended'));
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
            <div>{callLog}</div>
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
                    Answer
                </button>
                <button onClick={rejectCall} disabled={!incomingSession}>
                    Reject
                </button>
            </div>
        </div>
    );
};

export default App;
