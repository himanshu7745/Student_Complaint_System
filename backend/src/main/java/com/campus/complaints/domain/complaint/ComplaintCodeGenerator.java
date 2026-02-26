package com.campus.complaints.domain.complaint;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ComplaintCodeGenerator {

    private final Clock clock;
    private final AtomicLong sequence = new AtomicLong(1000);
    private int cachedYear = LocalDate.now(ZoneOffset.UTC).getYear();

    public synchronized String nextCode() {
        int year = LocalDate.now(clock).getYear();
        if (year != cachedYear) {
            cachedYear = year;
            sequence.set(1000);
        }
        long next = sequence.incrementAndGet();
        return "CMP-" + year + "-" + next;
    }
}
