import React from 'react';
import {Avatar, Tooltip} from "antd";
import styles from "@/components/RightContent/index.less";
import {getAvatarByUser} from "@/utils/avatar";

export default ({user, size = 24, marginLeft = 6}) => {
  if (user === undefined) {
    return <Avatar size={size}
                   src={getAvatarByUser()} alt="avatar"/>
  }
  // 是否和左边有距离，有的话则为2
  return (
    <>
      <Avatar size={size} className={styles.avatar}
              src={getAvatarByUser(user)}
              alt="avatar"/>
      <Tooltip title="点击可查看用户资料">
        {
          user.deleted_at ?
            <del><a style={{marginLeft: marginLeft, fontSize: 13, color: "#ccc"}} href={`/#/member/${user.id}`}
                    rel="noreferrer">{user.name}</a></del> :
            <a onClick={e => {
              e.stopPropagation();
            }} style={{marginLeft: marginLeft, fontSize: 13, verticalAlign: 'middle'}} href={`/#/member/${user.id}`}
               rel="noreferrer">{user.name}</a>
        }

      </Tooltip>
    </>
  )
}
