/**
 * Blueprint Export Utilities
 * Converts certification blueprint data to CSV or JSON format
 */

interface SubBullet {
  text: string;
  order: number;
}

interface Bullet {
  text: string;
  order: number;
  subBullets?: SubBullet[];
}

interface Objective {
  code: string;
  description: string;
  difficulty: string;
  order: number;
  bullets?: Bullet[];
}

interface Domain {
  name: string;
  weight: number;
  order: number;
  objectives: Objective[];
}

interface BlueprintData {
  certificationName: string;
  certificationCode: string;
  domains: Domain[];
}

/**
 * Export blueprint as JSON file
 */
export function exportBlueprintAsJSON(data: BlueprintData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.certificationCode}_blueprint.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export blueprint as CSV file
 */
export function exportBlueprintAsCSV(data: BlueprintData): void {
  const rows: string[] = [];

  // Header
  rows.push("Domain,Weight,Objective Code,Objective Description,Difficulty,Bullet,Sub-Bullet");

  // Iterate through domains
  data.domains.forEach((domain) => {
    domain.objectives.forEach((objective) => {
      if (objective.bullets && objective.bullets.length > 0) {
        objective.bullets.forEach((bullet) => {
          if (bullet.subBullets && bullet.subBullets.length > 0) {
            bullet.subBullets.forEach((subBullet) => {
              rows.push(
                `"${escapeCSV(domain.name)}",${Math.round(domain.weight * 100)}%,"${escapeCSV(
                  objective.code
                )}","${escapeCSV(objective.description)}","${objective.difficulty}","${escapeCSV(
                  bullet.text
                )}","${escapeCSV(subBullet.text)}"`
              );
            });
          } else {
            // Bullet without sub-bullets
            rows.push(
              `"${escapeCSV(domain.name)}",${Math.round(domain.weight * 100)}%,"${escapeCSV(
                objective.code
              )}","${escapeCSV(objective.description)}","${objective.difficulty}","${escapeCSV(
                bullet.text
              )}",""`
            );
          }
        });
      } else {
        // Objective without bullets
        rows.push(
          `"${escapeCSV(domain.name)}",${Math.round(domain.weight * 100)}%,"${escapeCSV(
            objective.code
          )}","${escapeCSV(objective.description)}","${objective.difficulty}","",""`
        );
      }
    });

    // If domain has no objectives
    if (domain.objectives.length === 0) {
      rows.push(`"${escapeCSV(domain.name)}",${Math.round(domain.weight * 100)}%,"","","","",""`);
    }
  });

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.certificationCode}_blueprint.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(str: string): string {
  if (str === null || str === undefined) return "";
  return str.replace(/"/g, '""');
}
