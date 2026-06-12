import type { Child } from "../domain/types";
import { createRepository, type Repository } from "../storage/repository";

const repository = createRepository();

export function ensureDefaultChild(activeRepository: Repository = repository): Promise<Child> {
  return activeRepository.ensureDefaultChild();
}

export function updateChild(
  child: Child,
  activeRepository: Repository = repository,
): Promise<Child> {
  return activeRepository.updateChild(child);
}
