import type { MediaAsset } from "../domain/types";
import { createRepository, type Repository } from "../storage/repository";

type MediaDraft = Omit<MediaAsset, "id" | "createdAt">;

const repository = createRepository();

export function saveMedia(
  asset: MediaDraft,
  activeRepository: Repository = repository,
): Promise<MediaAsset> {
  return activeRepository.saveMedia(asset);
}

export function getMedia(
  id: string,
  activeRepository: Repository = repository,
): Promise<MediaAsset | undefined> {
  return activeRepository.getMedia(id);
}
