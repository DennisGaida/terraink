import { useEffect, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import type { ExportFormat } from "@/features/export/domain/types";
import { CheckIcon, CloseIcon, CopyIcon, DownloadIcon, LinkIcon, LoaderIcon } from "@/shared/ui/Icons";
import SocialLinkGroup from "@/shared/ui/SocialLinkGroup";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { buildUrlSearchString } from "@/features/poster/application/urlState";

const FORMAT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "png", label: "PNG" },
  { format: "pdf", label: "PDF" },
  { format: "svg", label: "RSVG" },
];

interface ExportFabProps {
  isMobile: boolean;
}

export default function ExportFab({ isMobile }: ExportFabProps) {
  const { isExporting, exportPoster, handleCopyToClipboard } = useExport();
  const { state } = usePosterContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [isTriggerVisible, setIsTriggerVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isExporting && activeFormat) {
      setActiveFormat(null);
      setIsOpen(false);
    }
  }, [isExporting, activeFormat]);

  useEffect(() => {
    if (!isMobile) return;

    const FOOTER_OVERLAP_THRESHOLD_PX = 140;

    const updateVisibility = () => {
      const doc = document.documentElement;
      const scrolledToBottom =
        window.scrollY + window.innerHeight >=
        doc.scrollHeight - FOOTER_OVERLAP_THRESHOLD_PX;
      setIsTriggerVisible(!scrolledToBottom);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [isMobile]);

  const runExport = (format: ExportFormat) => {
    setActiveFormat(format);
    void exportPoster(format);
  };

  const handleCopyLink = () => {
    const search = buildUrlSearchString(state);
    const url = `${window.location.origin}${window.location.pathname}?${search}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const triggerClass = isMobile
    ? `mobile-export-fab-trigger${isTriggerVisible ? "" : " is-hidden"}`
    : "export-fab-trigger-desktop";

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        aria-label="Export poster"
        title="Export poster"
        onClick={() => setIsOpen(true)}
        tabIndex={isMobile && !isTriggerVisible ? -1 : 0}
        aria-hidden={isMobile && !isTriggerVisible}
      >
        <DownloadIcon />
        {!isMobile && <span>Download</span>}
      </button>

      {isOpen ? (
        <div
          className="export-modal-backdrop"
          role="presentation"
          onClick={() => !isExporting && setIsOpen(false)}
        >
          <div
            className="export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="export-modal-header">
              <h3 id="export-modal-title">Download Poster</h3>
              <button
                type="button"
                className="export-modal-close"
                onClick={() => !isExporting && setIsOpen(false)}
                aria-label="Close export options"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="export-modal-actions">
              <button
                type="button"
                className="export-modal-option export-modal-option--link"
                onClick={handleCopyLink}
              >
                {copied
                  ? <CheckIcon className="export-modal-option-icon" />
                  : <LinkIcon className="export-modal-option-icon" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
              <button
                type="button"
                className="export-modal-option export-modal-option--clipboard"
                onClick={() => { setActiveFormat("clipboard"); void handleCopyToClipboard(); }}
                disabled={isExporting}
              >
                {isExporting && activeFormat === "clipboard" ? (
                  <LoaderIcon className="export-modal-option-icon is-spinning" />
                ) : (
                  <CopyIcon className="export-modal-option-icon" />
                )}
                <span>Copy Image</span>
              </button>
              {FORMAT_OPTIONS.map(({ format, label }) => (
                <button
                  key={format}
                  type="button"
                  className={`export-modal-option export-modal-option--${format}`}
                  onClick={() => runExport(format)}
                  disabled={isExporting}
                >
                  {isExporting && activeFormat === format ? (
                    <LoaderIcon className="export-modal-option-icon is-spinning" />
                  ) : (
                    <DownloadIcon className="export-modal-option-icon" />
                  )}
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <p className="export-modal-support-label">
              Support the project <span className="heart">❤︎</span>
            </p>
            <SocialLinkGroup variant="mobile-export" />
          </div>
        </div>
      ) : null}
    </>
  );
}
