import { useEventStore } from '../../stores/events'

export function TimelineDock() {
  const events = useEventStore((s) => s.events)
  const recent = events.slice(-10)

  return (
    <div className="timeline-dock">
      <div className="timeline-header">
        <h3>Experiment Timeline</h3>
        <span className="timeline-count">{events.length} events</span>
      </div>

      {recent.length === 0 ? (
        <div className="timeline-empty">No events yet — start an experiment to see the timeline.</div>
      ) : (
        <div className="timeline-track">
          {recent.map((evt) => (
            <div key={evt.id} className="timeline-event">
              <div className="timeline-node" />
              <div className="timeline-event-label">{evt.type}</div>
              <div className="timeline-event-time">
                {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : `#${evt.sequence}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
