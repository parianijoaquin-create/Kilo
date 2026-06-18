// Minimal stub for web-push so the project type-checks before `npm install` runs on the build server.
// Once @types/web-push is installed, these declarations are shadowed by the real package.

declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload?: string | Buffer, options?: Record<string, unknown>): Promise<SendResult>;

  const _default: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
  };

  export { setVapidDetails, sendNotification };
  export default _default;
}
