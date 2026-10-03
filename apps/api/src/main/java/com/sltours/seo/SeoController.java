package com.sltours.seo;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/** Used by Nginx server-side includes and for the sitemap. Responses are generated per request (no caching). */
@RestController
@RequestMapping("/api/v1/seo")
public class SeoController {
    private final SeoService seo;
    public SeoController(SeoService seo) { this.seo = seo; }
    @GetMapping(value = "/head", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<String> head(@RequestParam(defaultValue = "/") String path) { return fresh(MediaType.TEXT_HTML, seo.head(path)); }
    @GetMapping(value = "/body", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<String> body(@RequestParam(defaultValue = "/") String path) { return fresh(MediaType.TEXT_HTML, seo.body(path)); }
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    ResponseEntity<String> sitemap() { return fresh(MediaType.APPLICATION_XML, seo.sitemap()); }
    private static ResponseEntity<String> fresh(MediaType type, String content) {
        return ResponseEntity.ok().contentType(new MediaType(type, java.nio.charset.StandardCharsets.UTF_8))
            .header(HttpHeaders.CACHE_CONTROL, "no-cache").body(content);
    }
}
