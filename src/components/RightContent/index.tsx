import { BellOutlined, BgColorsOutlined, FileTextOutlined, GithubOutlined } from '@ant-design/icons';
import {useEmotionCss} from '@ant-design/use-emotion-css';
import {history, useModel} from '@umijs/max';
import {Badge, Tooltip} from 'antd';
import React from 'react';
import CONFIG from '@/consts/config';
import Avatar from './AvatarDropdown';
import "./index.less"

type GlobalHeaderRightProps = {
  onOpenTheme?: () => void;
};

const GlobalHeaderRight = ({ onOpenTheme }: GlobalHeaderRightProps) => {
  const className = useEmotionCss(() => {
    return {
      display: 'flex',
      alignItems: 'center',
      height: '40px',
      marginLeft: 'auto',
      gap: 4,
    };
  });

  const actionClassName = useEmotionCss(({token}) => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '40px',
      cursor: 'pointer',
      padding: '0 8px',
      borderRadius: 8,
      color: '#475467',
      '&:hover': {
        color: '#111827',
        backgroundColor: token.colorBgTextHover,
      },
    };
  });

  const badgeClassName = useEmotionCss(() => {
    return {
      lineHeight: '40px',
      color: 'inherit',
    }
  })

  const {initialState} = useModel('@@initialState');
  const {noticeCount} = useModel('notice')

  if (!initialState || !initialState.settings) {
    return null;
  }

  return (
    <div className={className}>
      <Tooltip title="消息中心">
        <span className={actionClassName}
              onClick={() => {
                history.push("/notification")
              }}
        >
          <Badge className={badgeClassName} showZero={false} count={noticeCount || 0} size="small">
              <BellOutlined/>
          </Badge>
        </span>
      </Tooltip>
      <Tooltip title="主题设置">
        <span
          className={actionClassName}
          onClick={() => {
            onOpenTheme?.();
          }}
        >
          <BgColorsOutlined />
        </span>
      </Tooltip>
      <Tooltip title="GitHub">
        <span
          className={actionClassName}
          onClick={() => {
            window.open(CONFIG.GITHUB_URL, '_blank', 'noopener,noreferrer');
          }}
        >
          <GithubOutlined />
        </span>
      </Tooltip>
      <Tooltip title="帮助文档">
        <span
          className={actionClassName}
          onClick={() => {
            history.push('/knowledge');
          }}
        >
          <FileTextOutlined />
        </span>
      </Tooltip>
      <Avatar/>
      {/*<SelectLang className={actionClassName} />*/}
    </div>
  );
};

export default GlobalHeaderRight;
