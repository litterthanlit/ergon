import { describe, it, expect } from "vitest";
import { blocks, getBlock, getBlocksByRole, BLOCK_ROLES, ROLE_LABELS } from "@/lib/blocks";

describe("blocks registry", () => {
  it("has 18 blocks", () => {
    expect(blocks.length).toBe(18);
  });

  it("every block has required fields", () => {
    for (const block of blocks) {
      expect(block.id).toBeTruthy();
      expect(block.name).toBeTruthy();
      expect(block.role).toBeTruthy();
      expect(block.code).toContain("ergon.params(");
      expect(block.defaults.blendMode).toBeTruthy();
      expect(typeof block.defaults.opacity).toBe("number");
      expect(block.tags.length).toBeGreaterThan(0);
    }
  });

  it("every block has a valid role", () => {
    for (const block of blocks) {
      expect(BLOCK_ROLES).toContain(block.role);
    }
  });

  it("getBlock returns correct block", () => {
    const drift = getBlock("drift");
    expect(drift).toBeDefined();
    expect(drift!.name).toBe("Drift");
    expect(drift!.role).toBe("motion");
  });

  it("getBlock returns undefined for unknown id", () => {
    expect(getBlock("nonexistent")).toBeUndefined();
  });

  it("getBlocksByRole filters correctly", () => {
    const bases = getBlocksByRole("base");
    expect(bases.length).toBeGreaterThan(0);
    for (const b of bases) {
      expect(b.role).toBe("base");
    }
  });

  it("all 5 roles have at least one block", () => {
    for (const role of BLOCK_ROLES) {
      const roleBlocks = getBlocksByRole(role);
      expect(roleBlocks.length).toBeGreaterThan(0);
    }
  });

  it("ROLE_LABELS has labels for all roles", () => {
    for (const role of BLOCK_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});
