import { View } from 'react-native';
import { LevelTicket, type TicketState } from './LevelTicket';
import { TimelineSegment } from './TimelineSegment';
import type { JourneyLevel } from '../../game/data/journey';
export function LevelRow(props: { level: JourneyLevel; state: TicketState; stars: number; selected: boolean; current: boolean; first: boolean; last: boolean; onPress: () => void }) {
  return <View style={{ flexDirection: 'row', paddingRight: 13, paddingLeft: 4, paddingBottom: 8 }}><TimelineSegment {...props}/><LevelTicket {...props}/></View>;
}
