/**
 * Boards the Zephyr training supports. The `id` is the value readers pick in
 * <BoardTabs>; it is persisted per browser and shared by every page, and can
 * be preselected with a `?board=<id>` query string.
 */
export type Board = {
  id: string;
  label: string;
  /** Full `west build -b` target. */
  target: string;
  /** Overlay filename Zephyr looks for in `boards/`. */
  overlay: string;
  /** Page introducing the board. */
  page: string;
};

/** Tab order on every page. The first board is the default tab. */
export const BOARDS: readonly Board[] = [
  {
    id: 'efz_esp32s3',
    label: 'EFZ-ESP32S3',
    target: 'efz_esp32s3/esp32s3/procpu',
    overlay: 'efz_esp32s3_esp32s3_procpu.overlay',
    page: '/docs/zephyr-training/basic/efz-esp32s3-board',
  },
  {
    id: 'esp32s3_devkitc',
    label: 'ESP32-S3-DevKitC',
    target: 'esp32s3_devkitc/esp32s3/procpu',
    overlay: 'esp32s3_devkitc_esp32s3_procpu.overlay',
    page: '/docs/zephyr-training/basic/esp32s3-board',
  },
];
