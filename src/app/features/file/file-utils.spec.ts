import { resizeImage } from "./file-utils";

describe("FileUtils", () => {
  it("should resize a file", async () => {
    const mockedCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      toBlob: (cb: (blob: Blob) => void) =>
        cb(new Blob(["resized-content"], { type: "image/png" })),
    } as unknown as HTMLCanvasElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName === "canvas") {
          return mockedCanvas;
        }
        return originalCreateElement(tagName as any);
      });
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-file");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const OriginalImage = window.Image;
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: class {
        width = 500;
        height = 300;
        private _src: string | undefined;
        private _onload: (() => void) | undefined;
        set src(value: string) {
          this._src = value;
          if (this._onload) {
            queueMicrotask(() => this._onload?.());
          }
        }
        get onload() {
          return this._onload;
        }
        set onload(handler: (() => void) | undefined) {
          this._onload = handler;
          if (this._src && handler) {
            queueMicrotask(() => handler());
          }
        }
      },
    });

    try {
      const file = new File(["original-content"], "image.png", {
        type: "image/png",
      });
      const cvs = await resizeImage(file, 200);

      expect(cvs.width).toBe(200);
      expect(cvs.height).toBe(120);
      const cvsBlob = await new Promise<Blob>((res) => cvs.toBlob(res));
      const cvsFile = new File([cvsBlob], "image2.png", { type: "image/png" });
      expect(cvsFile.size).toBeGreaterThan(0);
    } finally {
      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      Object.defineProperty(window, "Image", {
        configurable: true,
        value: OriginalImage,
      });
    }
  });
});
