import {Card} from 'antd';
// @ts-ignore
import {Scrollbars} from 'react-custom-scrollbars';
import React, {memo, PropsWithChildren} from 'react';

type Props = {
  children?: React.ReactNode
};

interface ScrollCardProps {
  bodyPadding?: number | 24;
  hideOverflowX?: boolean;
}

const ScrollCard: React.FC<PropsWithChildren<ScrollCardProps>> = ({children, hideOverflowX, bodyPadding, ...cardProps}) => {
  return <Card {...cardProps} bodyStyle={{height: '100%', overflowX: 'hidden', padding: bodyPadding}}>
    {
      hideOverflowX ?
        <Scrollbars autoHide
                    autoHideTimeout={1000}
                    renderTrackHorizontal={(trackProps: any) => <div {...trackProps}
                                                         style={{display: 'none'}}
                                                         className="track-horizontal"/>}
                    autoHideDuration={200} style={{
          width: '100%', height: 'inherit',
        }}>
          {children}
        </Scrollbars> :
        <Scrollbars autoHide={true}
                    autoHideTimeout={1000}
                    autoHideDuration={200} style={{
          width: '100%', height: 'inherit',
        }}>
          {children}
        </Scrollbars>
    }
  </Card>
}

export default memo(ScrollCard);
