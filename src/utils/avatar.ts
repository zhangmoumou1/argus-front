import avatar0 from '@/assets/avatar/0.svg';
import avatar1 from '@/assets/avatar/1.svg';
import avatar2 from '@/assets/avatar/2.svg';
import avatar3 from '@/assets/avatar/3.svg';
import avatar4 from '@/assets/avatar/4.svg';
import avatar5 from '@/assets/avatar/5.svg';
import avatar6 from '@/assets/avatar/6.svg';
import avatar7 from '@/assets/avatar/7.svg';
import avatar8 from '@/assets/avatar/8.svg';
import avatar9 from '@/assets/avatar/9.svg';

const AVATAR_MAP = {
  '0': avatar0,
  '1': avatar1,
  '2': avatar2,
  '3': avatar3,
  '4': avatar4,
  '5': avatar5,
  '6': avatar6,
  '7': avatar7,
  '8': avatar8,
  '9': avatar9,
};

const resolveLastDigit = (value) => {
  const text = String(value ?? '').trim();
  const matched = text.match(/(\d)(?!.*\d)/);
  return matched ? matched[1] : '0';
};

export const getAvatarById = (value) => AVATAR_MAP[resolveLastDigit(value)] || AVATAR_MAP['0'];

export const getAvatarByUser = (user) => getAvatarById(user?.id);
