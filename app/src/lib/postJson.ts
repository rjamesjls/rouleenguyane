/**
 * POST JSON vers une route interne, avec un message d'erreur honnête.
 *
 * Le piège qu'on évite ici : `await res.json()` lève quand la réponse n'est pas
 * du JSON — typiquement un 500 au corps vide. Placé dans un `try/catch` avec le
 * `fetch`, cet échec devenait indiscernable d'une coupure réseau, et
 * l'utilisateur lisait « Vérifiez votre réseau » pour une erreur serveur.
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Seul cas réellement réseau : la requête n'a pas abouti.
    return { ok: false, error: 'Connexion impossible. Vérifiez votre réseau.' };
  }

  const brut = await res.text();

  let charge: unknown = null;
  if (brut) {
    try {
      charge = JSON.parse(brut);
    } catch {
      charge = null;
    }
  }

  if (!res.ok) {
    const message =
      charge && typeof charge === 'object' && 'error' in charge
        ? String((charge as { error: unknown }).error)
        : `Le serveur a répondu ${res.status}. Réessayez ou contactez le support.`;
    return { ok: false, error: message };
  }

  if (charge === null) {
    return { ok: false, error: 'Réponse inattendue du serveur.' };
  }

  return { ok: true, data: charge as T };
}
