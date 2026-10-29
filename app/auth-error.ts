import type {Lang} from './landing/copy';

// Supabase returns fixed English strings for the common auth failures. Students
// see the reason in their own language instead of a raw API message.
const TABLE: [string, string, string][] = [
  ['invalid login credentials', 'Wrong email or password.', 'Имэйл эсвэл нууц үг буруу байна.'],
  ['email not confirmed', 'Confirm your email first. The link was sent to the address you signed up with.', 'Имэйлээ баталгаажуулна уу. Бүртгүүлэхэд ашигласан хаяг руу холбоос илгээсэн.'],
  ['already registered', 'An account with this email already exists. Sign in instead.', 'Энэ имэйлээр бүртгэл байна. Нэвтэрч ороорой.'],
  ['password should have at least', 'The password is too short.', 'Нууц үг хэт богино байна.'],
  ['failed to fetch', 'Could not reach the server. Check the connection and try again.', 'Серверт хүрсэнгүй. холболтоо шалгаад дахин оролдоно уу.'],
  ['too many requests', 'Too many attempts. Wait a minute and try again.', 'Хэт олон оролдлого хийв. нэг минутын дараа дахин оролдоно уу.'],
  ['is not enabled', 'Google sign-in is not switched on for this project yet. Use your email and password.', 'Google-ээр нэвтрэх боломж одоогол нээгдээгүй байна. Имэйл болон нууц үгээрээ нэвтэрнэ үү.'],
];

export function explainAuthError(message: string, lang: Lang): string {
  const hit = TABLE.find(([key]) => message.toLowerCase().includes(key));
  if (hit) return lang === 'mn' ? hit[2] : hit[1];
  return message;
}
