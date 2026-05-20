import chatHandler from './chat';

export default async function handler(req, res) {
  req.body = {
    ...req.body,
    roomName: 'Private Companion',
    roomTheme: req.body?.mode || 'emotional support'
  };

  return chatHandler(req, res);
}
