# Chrome Web Store — Chrome Tab Router

> Last updated: 2026-10-22. Draft notes derived from the repository, not a verified copy of the live listing.

## Store listing

**Name:** Chrome Tab Router

**Short description:** Route links to your preferred Chrome profile, or keep selected URLs in their current profile without delays.

**Detailed description:**

Chrome Tab Router opens incoming links in the Chrome profile you choose for each URL pattern.

Create rules for your work and personal profiles. Confirm a handover on the router page or configure automatic routing. Add exceptions that keep matching tabs and popups in their original profile immediately, with no routing page or countdown. Choose whether each rule is shared with your connected profiles or kept only in the profile where you created it.

Open the extension's toolbar page, register your profiles, create your rules, and connect the profiles through the cloud option or a local relay. Cloud connections can work across machines; the local relay keeps communication on your own computer.

The extension processes tab URLs to apply your rules. Rules with sharing disabled are not sent to either relay. There is no analytics or advertising tracking.

**Suggested category:** Productivity

**Single purpose:** Open incoming links in the appropriate Chrome profile according to user-defined URL rules and exceptions.

**Primary language:** English

## Graphics and assets

Store icon and existing screenshot readiness have not been audited for this change. Refresh the Rules tab and Add/Change rule screenshots to show the action selector and Sync across profiles checkbox before publishing.

## Permissions justification

Production permissions are unchanged by this feature (`chromeextension/wxt.config.ts`).

| Permission | Type | Purpose |
| --- | --- | --- |
| `storage` | permissions | Save rules, profile configuration, connection credentials and the local routing log. |
| `tabs` | permissions | Read incoming tab URLs, open a link in the selected profile and close its source tab after a confirmed handover. |
| `webNavigation` | permissions | Identify the destination of newly created tabs whose URL is not available immediately. |
| `alarms` | permissions | Periodically check the connection and recover profile communication after inactivity. |
| `<all_urls>` | host_permissions | Support user-defined routing rules for arbitrary websites rather than a fixed domain list. |

Development builds additionally use `contextMenus` for development tools; production builds omit it.

## Privacy and data use

The extension processes tab URLs, configured rules and profile names, plus groupcode/pairing credentials. Cloud mode relays shared rules, profile information and handover URLs through the Azure backend; local mode relays messages only on the same machine. Cloud groupcodes contain the sign-in identity information described in the privacy policy.

Rules with `sync: false` are excluded from edits, merge replies and connection-time rule broadcasts. Current-profile matches generate no handover message. Turning an already shared rule private sends a deletion for its old shared version and creates a new private copy; previous sharing cannot be undone retroactively. Configuration and the tab log remain stored in the browser. No analytics or advertising identifiers are collected.

- Data is not sold.
- Data is used only for the extension's routing and connection functionality.
- Data is not used for creditworthiness or lending.

**Privacy policy:** https://chrome-tab-router.carlintveld.nl/privacy.html

The updated policy source is `app/public/privacy.html`; it still needs deployment before publishing. Confirm the live policy and dashboard disclosures at release time.

## Distribution and developer information

**Existing listing:** https://chrome.google.com/webstore/detail/chrome-tab-router/mdagoleaelpaicldokjcpelifdgmiglg

**Support:** https://github.com/cveld/chrome-tab-router/issues

**Homepage:** https://chrome-tab-router.carlintveld.nl

Publisher name, public contact email and distribution settings: verify in the existing developer dashboard; not inferred here.

## Version history

| Version | Date | Changes | Status |
| --- | --- | --- | --- |
| Next release (version not assigned) | 2026-10-22 | Current-profile exceptions without routing or countdown; optional per-rule sync. | Draft |

## Review notes

Existing rules retain their default routing action and shared scope. All participating profiles need an updated extension to interpret current-profile actions. The new exception takes priority over broader routing rules. No new permissions were added.
