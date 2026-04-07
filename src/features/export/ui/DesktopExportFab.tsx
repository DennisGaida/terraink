import { useEffect, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import type { ExportFormat } from "@/features/export/domain/types";
import { CheckIcon, DownloadIcon, LinkIcon, LoaderIcon } from "@/shared/ui/Icons";
import SupportModal from "@/features/export/ui/SupportModal";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { buildUrlSearchString } from "@/features/poster/application/urlState";

export default function DesktopExportFab() {
  const {
    isExporting,
    handleDownloadPng,
    handleDownloadPdf,
    handleDownloadSvg,
    supportPrompt,
    dismissSupportPrompt,
  } = useExport();
  const { state } = usePosterContext();
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isExporting) setActiveFormat(null);
  }, [isExporting]);

  const handleCopyLink = () => {
    const search = buildUrlSearchString(state);
    const url = `${window.location.origin}${window.location.pathname}?${search}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLoading = (fmt: ExportFormat) =>
    isExporting && activeFormat === fmt;

  return (
    <>
      <div className={`desktop-export-fab${isExporting ? " is-exporting" : ""}`}>
        {/* SVG + PDF + Link fly out above on hover */}
        <div className="desktop-export-flyout">
          <button
            type="button"
            className="desktop-export-btn desktop-export-btn--link"
            onClick={handleCopyLink}
          >
            {copied
              ? <CheckIcon className="desktop-export-btn-icon" />
              : <LinkIcon className="desktop-export-btn-icon" />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
          <button
            type="button"
            className="desktop-export-btn desktop-export-btn--svg"
            disabled={isExporting}
            onClick={() => { setActiveFormat("svg"); void handleDownloadSvg(); }}
          >
            {isLoading("svg")
              ? <LoaderIcon className="desktop-export-btn-icon is-spinning" />
              : <DownloadIcon className="desktop-export-btn-icon" />}
            <span>SVG</span>
          </button>
          <button
            type="button"
            className="desktop-export-btn desktop-export-btn--pdf"
            disabled={isExporting}
            onClick={() => { setActiveFormat("pdf"); void handleDownloadPdf(); }}
          >
            {isLoading("pdf")
              ? <LoaderIcon className="desktop-export-btn-icon is-spinning" />
              : <DownloadIcon className="desktop-export-btn-icon" />}
            <span>PDF</span>
          </button>
        </div>

        {/* Primary PNG button — shows "Download" by default, "PNG" on hover */}
        <button
          type="button"
          className="desktop-export-btn desktop-export-btn--primary"
          disabled={isExporting}
          onClick={() => { setActiveFormat("png"); void handleDownloadPng(); }}
        >
          {isLoading("png")
            ? <LoaderIcon className="desktop-export-btn-icon is-spinning" />
            : <DownloadIcon className="desktop-export-btn-icon" />}
          <span className="desktop-export-label-default">Download</span>
          <span className="desktop-export-label-hover">PNG</span>
        </button>
      </div>

      {supportPrompt ? (
        <SupportModal
          posterNumber={supportPrompt.posterNumber}
          onClose={dismissSupportPrompt}
          titleId="fab-export-support-modal-title"
        />
      ) : null}
    </>
  );
}


