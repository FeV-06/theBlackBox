// test
const instances = {
    "gmail": {
        instanceId: "gmail",
        enabled: true,
        layout: { x: 20, y: 20, w: 1000, h: 800 }
    },
    // The previous case where there is a big gap
    "insights": {
        instanceId: "insights",
        enabled: true,
        layout: { x: 20, y: 840, w: 1000, h: 400 } // Gap to gmail is 840 - (20+800) = 20
    }
};

const runPhysics = (instances, instanceId, collapsed, newH) => {
    const inst = instances[instanceId];
    const oldH = inst.layout.h;
    const dy = newH - oldH;

    const activeWidgets = Object.values(instances).filter(w => w.enabled && w.layout);

    const horizOverlap = (a, b) => {
        return (a.layout.x + 10) < (b.layout.x + b.layout.w) &&
            (a.layout.x + a.layout.w - 10) > b.layout.x;
    };

    const sortedWidgets = activeWidgets
        .filter(w => w.instanceId !== instanceId && w.layout.y >= inst.layout.y + (oldH * 0.4))
        .sort((a, b) => a.layout.y - b.layout.y);

    const shifts = {};

    for (const w of sortedWidgets) {
        const anchors = activeWidgets.filter(potentialAnchor =>
            potentialAnchor.instanceId !== w.instanceId &&
            potentialAnchor.layout.y + potentialAnchor.layout.h <= w.layout.y + 30 &&
            horizOverlap(w, potentialAnchor)
        );

        if (anchors.length === 0) continue;

        let maxAllowedUpwardShift = Math.abs(dy);

        for (const anchor of anchors) {
            if (anchor.instanceId === instanceId) {
                // If the anchor is the collapsing widget itself!
                // We should probably explicitly close the gap to them, 
                // but currently we just continue, letting maxAllowedUpwardShift stay Math.abs(dy)
                continue;
            }

            const anchorShift = shifts[anchor.instanceId] || 0;
            const distanceToAnchor = w.layout.y - (anchor.layout.y + anchor.layout.h);
            const spareDistance = Math.max(0, distanceToAnchor - 20); // 20px target gap

            maxAllowedUpwardShift = Math.min(maxAllowedUpwardShift, Math.abs(anchorShift) + spareDistance);
        }

        if (maxAllowedUpwardShift > 0) {
            shifts[w.instanceId] = -maxAllowedUpwardShift;
        }
    }

    return shifts;
};

console.log(runPhysics(instances, "gmail", true, 64));
