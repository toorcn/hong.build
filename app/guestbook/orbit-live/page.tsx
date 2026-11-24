import { ContentPanel } from '@/components/content-panel';
import { LiveGuestbook } from '@/components/guestbook/live';
export const metadata={title:'Guestbook — orbit'};
export default function Page(){return <ContentPanel title="Visitor signals" sub="guestbook / orbit" wide><LiveGuestbook mode="orbit"/></ContentPanel>}
