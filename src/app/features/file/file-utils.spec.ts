import { resizeImage } from "./file-utils";

describe("FileUtils", () => {
  it("should resize a file", async () => {
    const blob = await fetch("assets/child.png").then((res) => res.blob());
    const file = new File([blob], "image");

    const cvs = await resizeImage(file, 200);

    expect(cvs.height).toBe(200);
    expect(cvs.width).toBeLessThan(200);
    const cvsBlob = await new Promise<Blob>((res) => cvs.toBlob(res));
    const cvsFile = new File([cvsBlob], "image2");
    expect(cvsFile.size).toBeLessThan(file.size);
  });
});
