package api.controllers;

import api.dto.CatalogSnapshotDto;
import api.services.CatalogSnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog-snapshots")
@RequiredArgsConstructor
public class CatalogSnapshotsController {

    private final CatalogSnapshotService catalogSnapshotService;

    @GetMapping
    public List<CatalogSnapshotDto> list(
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) String codigo) {
        return catalogSnapshotService.list(entidad, codigo);
    }
}