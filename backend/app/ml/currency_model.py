import cv2
import numpy as np
import base64

def _to_base64(img_array):
    _, buffer = cv2.imencode(".jpg", img_array)
    return base64.b64encode(buffer).decode("utf-8")

def analyze_currency(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Could not decode image"}

    img = cv2.resize(img, (800, 400))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    scores = {}

    # 1. Sharpness / print quality (Laplacian variance) - genuine notes have crisp micro-print
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    scores["print_sharpness"] = min(lap_var / 500.0, 1.0)  # normalize

    # 2. Security thread detection (vertical line via Hough)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=80, minLineLength=150, maxLineGap=10)
    vertical_lines = 0
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line.flatten()
            if abs(int(x1) - int(x2)) < 8 and abs(int(y2) - int(y1)) > 100:
                vertical_lines += 1
    scores["security_thread"] = min(vertical_lines / 3.0, 1.0)

    # 3. Color consistency (genuine notes have controlled color palette; scan histogram spread)
    hist = cv2.calcHist([img], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    hist_norm = hist.flatten() / hist.sum()
    color_entropy = -np.sum(hist_norm * np.log2(hist_norm + 1e-9))
    scores["color_consistency"] = min(color_entropy / 6.0, 1.0)

    # 4. Texture uniformity (fake notes often have flatter/uniform texture from printing)
    texture_std = np.std(gray)
    scores["texture_richness"] = min(texture_std / 60.0, 1.0)

    overall_confidence = float(np.mean(list(scores.values())))
    verdict = "genuine" if overall_confidence >= 0.55 else "counterfeit"

    # Highlight suspicious regions: low-detail patches via sliding window Laplacian
    suspicious_regions = []
    h, w = gray.shape
    step = 100
    overlay = img.copy()
    for y in range(0, h - step, step):
        for x in range(0, w - step, step):
            patch = gray[y:y+step, x:x+step]
            patch_var = cv2.Laplacian(patch, cv2.CV_64F).var()
            if patch_var < lap_var * 0.4:  # notably flatter than average -> suspicious
                suspicious_regions.append({"x": x, "y": y, "w": step, "h": step})
                cv2.rectangle(overlay, (x, y), (x+step, y+step), (0, 0, 255), 2)

    return {
        "verdict": verdict,
        "confidence": round(float(overall_confidence), 3),
        "sub_scores": {k: round(float(v), 3) for k, v in scores.items()},
        "suspicious_regions": [
            {"x": int(r["x"]), "y": int(r["y"]), "w": int(r["w"]), "h": int(r["h"])}
            for r in suspicious_regions
        ],
        "annotated_image_base64": _to_base64(overlay),
    }