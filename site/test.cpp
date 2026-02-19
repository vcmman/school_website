#include <memory>
#include <cmath>

struct Node {
    float x;
    float y;
    std::shared_ptr<Node> next;
    
    Node(float px, float py) : x(px), y(py), next(nullptr) {}
};

// Calculate the cross product of vectors (p1->p2) and (p2->p3)
// Positive = counter-clockwise turn, Negative = clockwise turn, Zero = collinear
float crossProduct(const Node* p1, const Node* p2, const Node* p3) {
    float dx1 = p2->x - p1->x;
    float dy1 = p2->y - p1->y;
    float dx2 = p3->x - p2->x;
    float dy2 = p3->y - p2->y;
    return dx1 * dy2 - dy1 * dx2;
}

// Check if a polygon (represented as a linked list of 2D points) is convex
// Returns true if convex, false if concave
bool IsConvex(std::shared_ptr<Node> head) {
    if (!head || !head->next || !head->next->next) {
        return false; // Need at least 3 points to form a polygon
    }
    
    bool hasPositive = false;
    bool hasNegative = false;
    
    std::shared_ptr<Node> current = head;
    std::shared_ptr<Node> p1 = head;
    
    // Count the number of nodes to handle circular traversal
    int count = 0;
    std::shared_ptr<Node> temp = head;
    while (temp) {
        count++;
        temp = temp->next;
    }
    
    // Check all consecutive triplets of points
    for (int i = 0; i < count; i++) {
        std::shared_ptr<Node> p2 = p1->next ? p1->next : head;
        std::shared_ptr<Node> p3 = p2->next ? p2->next : head;
        
        // If we've wrapped around and don't have enough points, use head
        if (i == count - 2) {
            p3 = head;
        } else if (i == count - 1) {
            p2 = head;
            p3 = head->next;
        }
        
        float cross = crossProduct(p1.get(), p2.get(), p3.get());
        
        if (std::abs(cross) > 1e-10) { // Ignore near-zero values (collinear points)
            if (cross > 0) {
                hasPositive = true;
            } else {
                hasNegative = true;
            }
        }
        
        // If we have both positive and negative cross products, it's concave
        if (hasPositive && hasNegative) {
            return false;
        }
        
        p1 = p1->next;
        if (!p1) break;
    }
    
    return true; // All cross products have the same sign
}
