package api.controllers;

import api.dto.ClinicMessageDto;
import api.dto.MessageDraftDto;
import api.services.MessagesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessagesController {

    private final MessagesService messagesService;

    @GetMapping
    public List<ClinicMessageDto> list() {
        return messagesService.list();
    }

    @GetMapping("/unread-count")
    public long unreadCount() {
        return messagesService.unreadCount();
    }

    @PostMapping
    public ClinicMessageDto send(@RequestBody MessageDraftDto draft) {
        return messagesService.send(draft);
    }

    @PatchMapping("/{code}/read")
    public ClinicMessageDto markRead(@PathVariable String code) {
        return messagesService.markRead(code);
    }

    @PatchMapping("/{code}/unread")
    public ClinicMessageDto markUnread(@PathVariable String code) {
        return messagesService.markUnread(code);
    }
}
