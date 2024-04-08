import { Button, Flex, List } from 'antd';

import { ICallData } from '../../App';
import { PhoneOutlined } from '@ant-design/icons';
import { callStatuses } from '../../App';
import { getCallStatusIcon } from '../../callUtils';

interface ICallLogListProps {
    callLog: ICallData[];
    makeCall: (number: string) => void;
    callStatus: string;
    // callStatuses:  {
    //     idle: string;
    //     calling: string;
    //     inCall: string;
    //     ended: string;
    // }
}

export const CallLogList = ({
    callLog,
    makeCall,
    callStatus,
}: ICallLogListProps) => {
    return (
        <List
            dataSource={callLog.reverse()}
            renderItem={(item) => (
                <List.Item>
                    <Flex gap={5}>
                        {' '}
                        <img src={getCallStatusIcon(item)} alt='' />
                        <p>{item.number}</p>
                    </Flex>

                    <Flex vertical gap={3}>
                        <p
                            style={{
                                fontSize: '12px',
                                borderRadius: '16px',
                                padding: '4px',
                                background: 'lightgrey',
                                lineHeight: 1,
                            }}
                        >
                            {' '}
                            {item.date}
                        </p>

                        <Button
                            size='small'
                            style={{
                                backgroundColor: 'lightgreen',
                                alignSelf: 'end',
                            }}
                            disabled={callStatus !== callStatuses.idle}
                            onClick={() => makeCall(item.number)}
                            icon={<PhoneOutlined />}
                        />
                    </Flex>
                </List.Item>
            )}
        />
    );
};
