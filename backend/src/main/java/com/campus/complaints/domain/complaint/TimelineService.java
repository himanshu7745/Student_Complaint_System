package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.user.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final ComplaintTimelineRepository complaintTimelineRepository;

    @Transactional
    public ComplaintTimelineEntity add(ComplaintEntity complaint, TimelineEventType eventType, String oldValue, String newValue, UserEntity actor, String detail) {
        ComplaintTimelineEntity entity = new ComplaintTimelineEntity();
        entity.setComplaint(complaint);
        entity.setEventType(eventType);
        entity.setOldValue(oldValue);
        entity.setNewValue(newValue);
        entity.setActor(actor);
        entity.setDetail(detail);
        return complaintTimelineRepository.save(entity);
    }
}
